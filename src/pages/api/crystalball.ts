import TwoFourSevenDetector from '@/sites/247';
import On3Detector from '@/sites/on3';
import type {NextApiRequest, NextApiResponse} from 'next';

type Data = {};

export default async function handler(
    req: NextApiRequest, res: NextApiResponse<Data>) {
  const twoFourSeven = new TwoFourSevenDetector();
  await twoFourSeven.detect();

  const on3 = new On3Detector();
  await on3.detect();

  res.status(200).json('OK');
}