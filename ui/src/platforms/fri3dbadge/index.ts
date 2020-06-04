import { PlatformInterface } from '../../types';

export function newFri3dBadgePlatform(): PlatformInterface {
  return {
    key: 'Fri3dBadge',
    name: 'Fri3d Badge2',
    image: '/images/fri3d.png',
    // TODO: Change hex to "flash"
    capabilities: ['SerialUpload'], 
    defaultExtensions: [
      'Fri3dBadge General',
    ],
    extensions: [
      // TODO: Extension on the fri3dbadge will go here
      // see microbit code for ways to do that
    ],
  };
}
