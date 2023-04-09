export type Prediction = {
  playerKey: string; expertKey: string; predictionDate: string;
  expertName: string;
  playerName: string;
  prediction: string;
};

export const isPrediction = (prediction: object): prediction is Prediction => {
  return 'playerKey' in prediction && 'expertKey' in prediction &&
      'predictionDate' in prediction;
};