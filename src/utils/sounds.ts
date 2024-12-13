interface Sound {
  id: string;
  name: string;
  url: string;
  category: 'notification' | 'ambient' | 'bell';
}

const defaultSounds: Sound[] = [
  {
    id: 'gentle-bell',
    name: 'Gentle Bell',
    url: 'sounds/gentle-bell.mp3',
    category: 'bell'
  },
  {
    id: 'meditation-bowl',
    name: 'Meditation Bowl',
    url: 'sounds/meditation-bowl.mp3',
    category: 'notification'
  },
  {
    id: 'forest-ambient',
    name: 'Forest Ambience',
    url: 'sounds/forest-ambient.mp3',
    category: 'ambient'
  }
];

class SoundManager {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private soundBuffers: Map<string, AudioBuffer> = new Map();

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  async loadSound(sound: Sound): Promise<void> {
    if (this.soundBuffers.has(sound.id)) return;

    try {
      const response = await fetch(sound.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundBuffers.set(sound.id, audioBuffer);
    } catch (error) {
      console.error(`Error loading sound ${sound.name}:`, error);
    }
  }

  setVolume(volume: number) {
    this.gainNode.gain.value = volume / 100;
  }

  async playSound(soundId: string) {
    const buffer = this.soundBuffers.get(soundId);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);
    source.start();
  }
}

export const soundManager = new SoundManager();
export const availableSounds = defaultSounds;

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

export const playSound = async (type: 'click' | 'complete') => {
  const gainNode = audioContext.createGain();
  const oscillator = audioContext.createOscillator();
  
  gainNode.connect(audioContext.destination);
  oscillator.connect(gainNode);
  
  if (type === 'click') {
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    oscillator.type = 'sine';
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.05);
  } else if (type === 'complete') {
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
    oscillator.type = 'sine';
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  }
}; 