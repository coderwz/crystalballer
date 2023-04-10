import {isPrediction, Prediction} from '@/types/prediction';
import Notifier from '@/utils/notifier';
import axios from 'axios';
import * as cheerio from 'cheerio';
import {MongoClient} from 'mongodb';


const FETCH_URL = 'https://www.on3.com/db/expert-predictions/football/2024/';

export default class On3Detector {
  private readonly notifier: Notifier;
  private readonly dbClient: MongoClient;

  constructor() {
    this.notifier = new Notifier();
    this.dbClient = new MongoClient(process.env.MONGODB_URI!);
  }

  async detect() {
    return axios.get(FETCH_URL)
        .then(async response => {
          const $ = cheerio.load(response.data);

          const predictions =
              $('ul[class^="PredictionCenterList_predictionListWrapper__"] li:has([class^="PredictionCenterItem_predictorWrapper"])')
                  .map((_, item) => {
                    const item$ = cheerio.load(item);
                    const playerName =
                        item$('[class^="PredictionCenterItem_playerName"] span')
                            .text();
                    const expertName =
                        item$(
                            '[class^="PredictionCenterItem_predictorInfoWrapper"] a')
                            .text();
                    const predictionTime =
                        item$(
                            '[class^="PredictionCenterItem_dateTime"],[class*=" PredictionCenterItem_dateTime"]')
                            .text();
                    const prediction = this.capitalizeFirstLetters(
                        item$('img[class^="PredictionCenterItem_teamLogo"]')
                            .attr('title') ??
                        '');

                    return {
                      playerKey: playerName,
                      playerName,
                      expertKey: expertName,
                      expertName,
                      predictionDate: predictionTime,
                      prediction,
                    };
                  })
                  .get()
                  .filter(isPrediction);

          try {
            const db = this.dbClient.db(process.env.MONGODB_DB_NAME!);
            const collection =
                db.collection(process.env.MONGODB_DB_ON3_COLLECTION!);

            const old =
                (await collection.findOne({}, {sort: {$natural: -1}})) as
                unknown as Prediction;

            const newPrediction = predictions[0];

            if (!old || old.expertKey !== newPrediction.expertKey ||
                old.playerKey !== newPrediction.playerKey) {
              await this.notifier.notify(`On3 RPM Alert!!! => ${
                  newPrediction.expertName} predicts ${
                  newPrediction.playerName} to ${newPrediction.prediction}`);

              await collection.insertOne(newPrediction);
            }

          } catch (err) {
            console.log('Error connecting with mongodb: ', err);
          } finally {
            this.dbClient.close();
          }

          return predictions.join(' ');
        })
        .catch(err => {
          console.log('There is some error with on3 detection: ', err);

          this.notifier.notify(
              `There is some error with on3 detection: ${err}`);
        });
  }

  private capitalizeFirstLetters(str: string) {
    return str.trim()
        .split(' ')
        .map(item => item.charAt(0).toUpperCase() + item.slice(1))
        .join(' ');
  }
}