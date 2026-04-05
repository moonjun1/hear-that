export interface Reaction {
  id: string;
  lat: number;
  lng: number;
  emoji: string;
  text: string | null;
  created_at: string;
  h3_index: string;
  device_uuid: string;
}

export interface WeatherEvent {
  id: string;
  lat: number;
  lng: number;
  type: string;
  source: string;
  created_at: string;
  h3_index: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  h3_index: string;
  device_uuid: string;
  created_at: string;
}
