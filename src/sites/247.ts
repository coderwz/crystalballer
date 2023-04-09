import {is247Prediction} from '@/types/247';
import Notifier from '@/utils/notifier';
import axios from 'axios';

const fs = require('fs')


const FETCH_URL =
    'https://ipa.247sports.com/rdb/v1/sites/33/sports/1/currentTargetPredictions/?pageSize=3';

const DATA_FILE = 'src/data/247.json';

export default class TwoFourSevenDetector {
  private readonly notifier: Notifier;

  constructor() {
    this.notifier = new Notifier();
  }

  async detect() {
    return axios.get(FETCH_URL)
        .then(response => {
          if (Array.isArray(response.data)) {
            const predictions = response.data.filter(is247Prediction);

            predictions.sort(
                (p1, p2) => new Date(p2.predictionDate).getTime() -
                    new Date(p1.predictionDate).getTime());

            if (predictions.length) {
              const oldObj = JSON.parse(fs.readFileSync(DATA_FILE));

              if (!is247Prediction(oldObj) ||
                  (oldObj.expertKey !== predictions[0].expertKey ||
                   oldObj.playerKey !== predictions[0].playerKey)) {
                this.notifier.notify('There is a new 247 crystal ball!!!');

                fs.writeFileSync(DATA_FILE, JSON.stringify(predictions[0]));
              }
            }
          }

          return response.data;
        })
        .catch(err => {
          this.notifier.notify(
              `There is some error with 247 detection: ${err}`);
        });
  }
}