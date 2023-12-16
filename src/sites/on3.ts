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
                item$('a[class*=" PredictionCenterItem_teamLogoLink__"]')
                    .map((_, teamLink) => $(teamLink).attr('href') ?? '')
                    .map(
                        (_, teamName) =>
                            this.extractTeamNameFromLink(teamName));

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

  private extractTeamNameFromLink(href: string) {
    const pattern =
        /\/college\/([a-z\-]+)\/football\/\d+\/industry-comparison-commits\//;

    const schoolName = (href.match(pattern) ?? [])[1] ?? '';

    return schoolName.split('-')
        .filter(Boolean)
        .map(str => (str[0].toUpperCase() + str.slice(1)))
        .join(' ');
  }
}