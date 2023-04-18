import {isPrediction} from '@/types/prediction';
import {Detector} from '@/utils/detector';


const FETCH_URL =
    'https://ipa.247sports.com/rdb/v1/sites/33/sports/1/currentTargetPredictions/?pageSize=3';

export default class TwoFourSevenDetector {
  private readonly detector: Detector;

  constructor() {
    this.detector = new Detector(
        '247 Crystal ball', process.env.MONGODB_DB_247_COLLECTION!,
        'https://247sports.com/');
  }

  async detect() {
    const data = await this.detector.load(FETCH_URL);

    if (Array.isArray(data)) {
      const predictions = data.filter(isPrediction);

      predictions.sort(
          (p1, p2) => new Date(p2.predictionDate!).getTime() -
              new Date(p1.predictionDate!).getTime());

      if (!predictions.length) {
        throw new Error('247 returning no predictions!');
      }

      await this.detector.compareAndNotify(predictions[0]);
    } else {
      console.error('Incorrect 247 data format: ', data);
    }
  }
}