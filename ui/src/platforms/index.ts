import { Platform, PlatformInterface, PlatformSelection } from '../types';
import { newCalliopePlatform } from './calliope';
import { newCircuitPythonPlatform } from './circuitpython';
import { newMicrobitPlatform } from './microbit';
import { newRaspberryPiPlatform } from './raspberrypi';
import { newWebPlatform } from './python';
import { newFri3dBadgePlatform } from './fri3dbadge';


export function getPlatformList(): PlatformSelection[] {
  return [
    { platform: 'Python', title: 'Python 3', image: '/images/webpy.png', help: 'https://edublocks.org/python.html' },
    // { title: 'Advanced Python', image: '/images/advpy.png', help: 'https://edublocks.org' },
    { platform: 'RaspberryPi', title: 'Raspberry Pi', image: '/images/pi.png', help: 'https://edublocks.org/pi.html' },
    { platform: 'MicroBit', title: 'micro:bit', image: '/images/microbit.png', help: 'https://edublocks.org/microbit.html' },
    { platform: 'Fri3dBadge', title: 'Fri3d Badge', image: '/images/fri3d.png', help: 'https://fri3d.be/' },
    { platform: 'CircuitPython', title: 'CircuitPython', image: '/images/circuitplayground.png', help: 'https://edublocks.org/circuitpy.html' },
    // { platform: 'Calliope', title: 'Calliope Mini', image: '/images/calliope.png', help: 'https://docs.edublocks.org/mode-guides/calliope' },
  ];
}

export async function getPlatform(platform: Platform): Promise<PlatformInterface> {
  switch (platform) {
    case 'Python':
      return newWebPlatform();
    case 'MicroBit':
      return newMicrobitPlatform(); 
    case 'RaspberryPi':
      return newRaspberryPiPlatform();
    case 'CircuitPython': 
      return newCircuitPythonPlatform();
    case 'Calliope':
      return newCalliopePlatform();
    case 'Fri3dBadge':
      return newFri3dBadgePlatform();
    default:
      throw new Error('Invalid platform: ' + platform);
      
  }
  
  
}
