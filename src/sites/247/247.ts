import {isPrediction} from '@/types/prediction';
import {Detector} from '@/utils/detector';

import {SchoolMappings} from './school-mappings';


const FETCH_URL =
    'https://ipa.247sports.com/rdb/v1/sites/33/sports/1/currentTargetPredictions/?pageSize=3';

export default class TwoFourSevenDetector {
  private readonly detector: Detector;

  constructor() {
    this.detector = new Detector(
        '247 Crystal ball', process.env.MONGODB_DB_247_COLLECTION!,
        'https://247sports.com/Season/2025-Football/CurrentTargetPredictions/');
  }

  async detect() {
    const data = await this.detector.load(FETCH_URL);

    if (Array.isArray(data)) {
      const predictions =
          data.filter(isPrediction)
              .map(prediction => ({
                     ...prediction,
                     prediction: SchoolMappings[prediction.prediction] ??
                         prediction.prediction,
                   }));

      predictions.sort(
          (p1, p2) => new Date(p2.predictionDate!).getTime() -
              new Date(p1.predictionDate!).getTime());

      await this.detector.compareAndNotify(predictions);
    } else {
      console.error('Incorrect 247 data format: ', data);
    }
  }
}