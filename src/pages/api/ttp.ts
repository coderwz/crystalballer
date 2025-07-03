import Notifier from '@/utils/notifier';
import {NextApiRequest, NextApiResponse} from 'next/types';

type Data = {};

interface SlotAvailabilityResponse {
  'availableSlots': Array<any>;
  'lastPublishedDate': string;
}

export default async function handler(
    req: NextApiRequest, res: NextApiResponse<Data>) {
  // Chicago enrollment center
  const locationId = 11981;

  try {
    const data = await fetchSlotAvailability(locationId);
    let available = false;
    if (data.availableSlots.length > 0) {
      available = true;
      const notifier = new Notifier();
      const content = 'Ding ding ding!!! A new slot is available, chop chop!'
      notifier.notify(content);
    } else {
      console.log('No interview slots available at this location.')
    }
    res.status(200).json(available)
  } catch (err) {
    console.error('Failed to retrieve slot availability:', err);
    res.send({error: err});
  }
}

async function fetchSlotAvailability(locationId: number):
    Promise<SlotAvailabilityResponse> {
  const url =
      `https://ttp.cbp.dhs.gov/schedulerapi/slot-availability?locationId=${
          locationId}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: SlotAvailabilityResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching slot availability:', error);
    throw error;  // Re-throw the error for further handling if needed
  }
}