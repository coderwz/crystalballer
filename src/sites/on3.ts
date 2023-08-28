import {isPrediction} from '@/types/prediction';
import {Detector} from '@/utils/detector';
import * as cheerio from 'cheerio';


const FETCH_URLS = [
  'https://www.on3.com/db/expert-predictions/football/2024/',
  'https://www.on3.com/db/expert-predictions/football/2025/',
];

export default class On3Detector {
  private readonly detector: Detector;

  constructor() {
    this.detector = new Detector(
        'On3 RPM', process.env.MONGODB_DB_ON3_COLLECTION!,
        'https://www.on3.com/db/expert-predictions/football/2024/');
  }

  async detect() {
    const allPredictions = await Promise.all(FETCH_URLS.map(async url => {
      const data = await this.detector.load(url);

      const $ = cheerio.load(data);

      return $('ul[class^="PredictionCenterList_predictionListWrapper__"] li:has([class^="PredictionCenterItem_predictorWrapper"])')
          .map((_, item) => {
            const item$ = cheerio.load(item);
            const playerName =
                item$('[class^="PredictionCenterItem_playerName"] span').text();
            const expertName =
                item$('[class^="PredictionCenterItem_predictorInfoWrapper"] a')
                    .text();
            const predictionTime =
                item$(
                    '[class^="PredictionCenterItem_confidenceDateContainer__"] [class*=" PredictionCenterItem_dateTime"]')
                    .last()
                    .text();
            const isFlipping =
                item$('[class^="PredictionCenterItem_predictionSwappedIcon__"]')
                    .length > 0;
            const predictions =
                item$('img[class^="PredictionCenterItem_teamLogo"]')
                    .map((_, teamImg) => $(teamImg).attr('title') ?? '')
                    .map(
                        (_, teamName) => this.capitalizeFirstLetters(teamName));

            return {
              playerKey: playerName,
              playerName,
              expertKey: expertName,
              expertName,
              predictionDate: new Date(predictionTime).toISOString(),
              prediction: isFlipping ? predictions[1] : predictions[0],
            };
          })
          .get()
          .filter(isPrediction);
    }));

    const sortedPredictions =
        allPredictions.flat()
            .sort(
                (p1, p2) => new Date(p2.predictionDate).getTime() -
                    new Date(p1.predictionDate).getTime())
            .slice(0, 20);

    await this.detector.compareAndNotify(sortedPredictions);
  }

  private capitalizeFirstLetters(str: string) {
    return str.trim()
        .split(' ')
        .map(item => item.charAt(0).toUpperCase() + item.slice(1))
        .join(' ');
  }
}