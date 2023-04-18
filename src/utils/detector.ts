import {Prediction} from '@/types/prediction';
import axios from 'axios';
import {MongoClient} from 'mongodb';

import Notifier from './notifier';

export class Detector {
  private readonly notifier: Notifier;
  private readonly dbClient: MongoClient;

  constructor(
      readonly predictionName: string,
      readonly dbCollection: string,
      readonly siteUrl: string,
  ) {
    this.notifier = new Notifier();
    this.dbClient = new MongoClient(process.env.MONGODB_URI!);
  }

  load(url: string) {
    return axios.get(url).then(response => response.data).catch(err => {
      console.error(`Error fetching ${url}: `, err);
    });
  }

  async compareAndNotify(newPrediction?: Prediction) {
    if (!newPrediction) {
      console.error(`No new ${this.predictionName} prediction`);

      return;
    }

    try {
      const db = this.dbClient.db(process.env.MONGODB_DB_NAME!);
      const collection = db.collection(this.dbCollection);

      const old = (await collection.findOne({}, {sort: {$natural: -1}})) as
          unknown as Prediction;

      if (!old || old.expertKey !== newPrediction.expertKey ||
          old.playerKey !== newPrediction.playerKey) {
        await this.notifier.notify(`${this.predictionName} Alert!!! => ${
            newPrediction.expertName} predicts ${newPrediction.playerName} to ${
            newPrediction.prediction}
            
            Visit <a href="${this.siteUrl}">${this.siteUrl}</a> for details.`);

        const res = await collection.insertOne(newPrediction);

        if (res.insertedId) {
          console.log(
              'Successfully inserted to db for id: ', res.insertedId.id);
        }
      }

    } catch (err) {
      console.error('Error connecting with mongodb: ', err);
    } finally {
      this.dbClient.close();
    }
  }
}