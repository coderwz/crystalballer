import {Prediction} from '@/types/prediction';
import {Detector} from '@/utils/detector';
import * as cheerio from 'cheerio';


const FETCH_URL = 'https://n.rivals.com/futurecast';
const PREDICTION_REGEX =
    /^([a-zA-Z\s]+)\sforecasts\s([a-zA-Z\s]+)\s\(.*?\)\sto\s([a-zA-Z\s]+)\.$/;

export default class RivalsDetector {
  private readonly detector: Detector;

  constructor() {
    this.detector = new Detector(
        'Rivals FutureCast', process.env.MONGODB_DB_RIVALS_COLLECTION!,
        FETCH_URL);
  }

  async detect() {
    const data = await this.detector.load(FETCH_URL);

    const $ = cheerio.load(data);

    const newPredictionTexts =
        Array
            .from($(
                '[class^="RecentForecasts_forecastList__"] [class^="ForecastActivity_forecastText__"]:lt(10)'))
            .map(html => $(html).text().split(/\s+/).join(' '));

    const predictions =
        newPredictionTexts.map(text => text.match(PREDICTION_REGEX))
            .filter(Boolean)
            .map(match => ({
                            expertKey: match![1],
                            expertName: match![1],
                            playerKey: match![2],
                            playerName: match![2],
                            prediction: match![3],
                          }) as Prediction);

    await this.detector.compareAndNotify(predictions);
  }
}