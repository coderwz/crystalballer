import TwoFourSevenDetector from '@/sites/247/247';
import On3Detector from '@/sites/on3';
import RivalsDetector from '@/sites/rivals';
import type {NextApiRequest, NextApiResponse} from 'next';

type Data = {};

export default async function handler(
    req: NextApiRequest, res: NextApiResponse<Data>) {
  const site = req.query['site'];

  if (!site || site === '247') {
    console.log('Detecting 247');
    const twoFourSeven = new TwoFourSevenDetector();
    await twoFourSeven.detect();
  }

  if (!site || site === 'on3') {
    console.log('Detecting On3');
    const on3 = new On3Detector();
    await on3.detect();
  }

  if (!site || site === 'rivals') {
    console.log('Detecting Rivals');
    const rivals = new RivalsDetector();
    await rivals.detect();
  }

  res.status(200).json('OK');
}