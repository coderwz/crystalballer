import {is247Prediction, Prediction} from '@/types/247';
import Notifier from '@/utils/notifier';
import axios from 'axios';
import {MongoClient} from 'mongodb';


const FETCH_URL =
    'https://ipa.247sports.com/rdb/v1/sites/33/sports/1/currentTargetPredictions/?pageSize=3';

export default class TwoFourSevenDetector {
  private readonly notifier: Notifier;
  private readonly dbClient: MongoClient;

  constructor() {
    this.notifier = new Notifier();
    this.dbClient = new MongoClient(process.env.MONGODB_URI!);
  }

  async detect() {
    return axios.get(FETCH_URL)
        .then(async response => {
          if (Array.isArray(response.data)) {
            const predictions = response.data.filter(is247Prediction);

            predictions.sort(
                (p1, p2) => new Date(p2.predictionDate).getTime() -
                    new Date(p1.predictionDate).getTime());

            if (!predictions.length) {
              throw new Error('247 returning no predictions!');
            }

            try {
              const db = this.dbClient.db(process.env.MONGODB_DB_NAME!);
              const collection =
                  db.collection(process.env.MONGODB_DB_247_COLLECTION!);

              const old =
                  (await collection.findOne({}, {sort: {$natural: -1}})) as
                  unknown as Prediction;

              const newPrediction = predictions[0];

              if (old.expertKey !== newPrediction.expertKey ||
                  old.playerKey !== newPrediction.playerKey) {
                this.notifier.notify(`Crystal Ball Alert!!! => ${
                    newPrediction.expertName} predicts ${
                    newPrediction.playerName} to ${newPrediction.prediction}`);

                await collection.insertOne(newPrediction);
              }

            } catch (err) {
              console.log('Error connecting with mongodb: ', err);
            } finally {
              this.dbClient.close();
            }
          } else {
            console.error('247 response is not an array.');
          }

          return response.data;
        })
        .catch(err => {
          console.log('There is some error with 247 detection: ', err);

          this.notifier.notify(
              `There is some error with 247 detection: ${err}`);
        });
  }
}