import { PlatformInterface } from '../../types';

export function newMicrobitPlatform(): PlatformInterface {
  return {
    key: 'MicroBit',
    name: 'micro:bit',
    image: '/images/microbit.png',
    capabilities: ['HexDownload', 'HexFlash'], 
    defaultExtensions: [
      'micro:bit General',
    ],
    extensions: [
      'scrollbit',
      'GiggleBot',
      //Automated Extensions under here

      'DriveBit',

      'BitBotXL',

      'MoveMini',

      'Minibit',
      
    ],
  };
}
