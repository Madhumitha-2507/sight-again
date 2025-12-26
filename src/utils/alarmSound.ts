// Create an alarm sound using Web Audio API
let audioContext: AudioContext | null = null;

export const playAlarmSound = () => {
  try {
    // Create or reuse AudioContext
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Resume context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const now = audioContext.currentTime;

    // Create oscillators for alarm effect
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect nodes
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set frequencies for alarm sound (alternating tones)
    oscillator1.frequency.setValueAtTime(800, now);
    oscillator1.frequency.setValueAtTime(600, now + 0.2);
    oscillator1.frequency.setValueAtTime(800, now + 0.4);
    oscillator1.frequency.setValueAtTime(600, now + 0.6);
    oscillator1.frequency.setValueAtTime(800, now + 0.8);

    oscillator2.frequency.setValueAtTime(1200, now);
    oscillator2.frequency.setValueAtTime(1000, now + 0.2);
    oscillator2.frequency.setValueAtTime(1200, now + 0.4);
    oscillator2.frequency.setValueAtTime(1000, now + 0.6);
    oscillator2.frequency.setValueAtTime(1200, now + 0.8);

    // Set oscillator types
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';

    // Volume envelope
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1);

    // Start and stop oscillators
    oscillator1.start(now);
    oscillator2.start(now);
    oscillator1.stop(now + 1);
    oscillator2.stop(now + 1);

  } catch (error) {
    console.error('Error playing alarm sound:', error);
  }
};
