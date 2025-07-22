export interface ResponseEngine {
  type: string;
  llm_id: string;
}

export interface DefaultVal {
  voice_id: string;
  voice_speed: number;
  volume: number;
  responsiveness: number;
  interruption_sensitivity: number;
  ambient_sound_volume: number;
  denoising_mode: string;
  enable_backchannel: boolean;
  backchannel_frequency: number;
  backchannel_words: string[];
  normalize_for_speech: boolean;
  voice_model: string;
  language: string;
  response_engine: ResponseEngine;
  knowledge_base_ids: string[];
  model: string;
}
