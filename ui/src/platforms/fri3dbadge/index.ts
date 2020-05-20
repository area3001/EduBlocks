import { PlatformInterface } from '../../types';

export function newFri3dBadgePlatform(): PlatformInterface {
  return {
    key: 'Fri3dBadge',
    name: 'Fri3d Badge',
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
