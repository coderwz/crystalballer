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

  async compareAndNotify(newPredictions: Prediction[]) {
    if (!newPredictions.length) {
      console.log(`No new ${this.predictionName} prediction`);

      return;
    }

    try {
      const db = this.dbClient.db(process.env.MONGODB_DB_NAME!);
      const collection = db.collection(this.dbCollection);

      const existingPredictions =
          (await collection.find({}, {sort: {$natural: -1}})
               .limit(10)
               .toArray()) as unknown as Prediction[];
      const existingPredictionKeys = new Set(existingPredictions.map(
          prediction => `${prediction.playerKey}-${prediction.expertKey}`));

      const toBeNotified = newPredictions.slice(0, 10).filter(
          prediction => !existingPredictionKeys.has(
              `${prediction.playerKey}-${[prediction.expertKey]}`));

      if (toBeNotified.length) {
        await this.notifier.notify(this.composeNotificationEmail(toBeNotified));

        await collection.insertMany(toBeNotified);
      }

    } catch (err) {
      console.error('Error connecting with mongodb: ', err);
    } finally {
      this.dbClient.close();
    }
  }

  private composeNotificationEmail(newPredictions: Prediction[]) {
    let res = `${this.predictionName} Alert!!! =><br>`;
    res +=
        newPredictions
            .map(
                newPrediction => ` - ${newPrediction.expertName} predicts ${
                    newPrediction.playerName} to ${newPrediction.prediction}`)
            .join('<br>');

    res +=
        `<br>Visit <a href="${this.siteUrl}">${this.siteUrl}</a> for details.`;

    return res;
  }
}