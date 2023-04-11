import {isPrediction} from '@/types/prediction';
import {Detector} from '@/utils/detector';
import * as cheerio from 'cheerio';


const FETCH_URL = 'https://www.on3.com/db/expert-predictions/football/2024/';

export default class On3Detector {
  private readonly detector: Detector;

  constructor() {
    this.detector = new Detector(
        'On3 RPM', process.env.MONGODB_DB_ON3_COLLECTION!,
        'https://www.on3.com/db/expert-predictions/football/2024/');
  }

  async detect() {
    const data = await this.detector.load(FETCH_URL);

    const $ = cheerio.load(data);

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

    this.detector.compareAndNotify(predictions[0]);
  }

  private capitalizeFirstLetters(str: string) {
    return str.trim()
        .split(' ')
        .map(item => item.charAt(0).toUpperCase() + item.slice(1))
        .join(' ');
  }
}