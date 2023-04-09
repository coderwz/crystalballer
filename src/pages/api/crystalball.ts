import TwoFourSevenDetector from '@/sites/247';
import * as dotenv from 'dotenv'  // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

import type {NextApiRequest, NextApiResponse} from 'next';

dotenv.config();

type Data = {};

export default async function handler(
    req: NextApiRequest, res: NextApiResponse<Data>) {
  const twoFourSeven = new TwoFourSevenDetector();
  const data = await twoFourSeven.detect();

  res.status(200).json(data);
}