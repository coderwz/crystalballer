import Notifier from '@/utils/notifier';
import {NextApiRequest, NextApiResponse} from 'next/types';

type Data = {};

export default async function handler(
    req: NextApiRequest, res: NextApiResponse<Data>) {
  // Chicago enrollment center
  const locationId = 11981;

  try {
    const data = await fetchSlotAvailability(locationId);
    let available = false;
    if (data.length > 0) {
      available = true;
      const notifier = new Notifier();
      const content = 'Ding ding ding!!! A new slot is available, chop chop!';
      const subject = 'A new TTP slot is available!';
      notifier.notify(content, subject);
    } else {
      console.log('No interview slots available at this location.')
    }
    res.status(200).json(available)
  } catch (err) {
    console.error('Failed to retrieve slot availability:', err);
    res.send({error: err});
  }
}

async function fetchSlotAvailability(locationId: number): Promise<any[]> {
  const url =
      `https://ttp.cbp.dhs.gov/schedulerapi/slots?orderBy=soonest&limit=11&locationId=${
          locationId}&minimum=0`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: any[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching slot availability:', error);
    throw error;  // Re-throw the error for further handling if needed
  }
}