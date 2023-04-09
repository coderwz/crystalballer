import TwoFourSevenDetector from '@/sites/247';
import type {NextApiRequest, NextApiResponse} from 'next';

type Data = {};

export default async function handler(
    req: NextApiRequest, res: NextApiResponse<Data>) {
  const twoFourSeven = new TwoFourSevenDetector();
  const data = await twoFourSeven.detect();

  res.status(200).json(data);
}