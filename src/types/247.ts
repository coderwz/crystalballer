export type Prediction = {
  playerKey: number; expertKey: number; predictionDate: string;
  expertName: string;
  playerName: string;
  prediction: string;
};

export const is247Prediction = (prediction:
                                    object): prediction is Prediction => {
  return ('playerKey' in prediction &&
          typeof prediction.playerKey === 'number') &&
      ('expertKey' in prediction && typeof prediction.expertKey === 'number') &&
      ('predictionDate' in prediction &&
       typeof prediction.predictionDate === 'string');
};