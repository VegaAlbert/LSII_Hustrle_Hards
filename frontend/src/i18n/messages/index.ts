import { analytics } from './analytics';
import { auth } from './auth';
import { categories } from './categories';
import { comments } from './comments';
import { common } from './common';
import { library } from './library';
import { nav } from './nav';
import { settings } from './settings';
import { upload } from './upload';
import { video } from './video';
import { videos } from './videos';

/**
 * Every text of the UI, grouped by area. A key is `<group>.<name>`, e.g. `nav.login`. To add an area, create its
 * file with defineMessages() and list it here.
 */
export const MESSAGES = {
  analytics,
  auth,
  categories,
  comments,
  common,
  library,
  nav,
  settings,
  upload,
  video,
  videos,
};

type Groups = typeof MESSAGES;

export type MessageKey = {
  [G in keyof Groups]: `${G & string}.${keyof Groups[G]['en'] & string}`;
}[keyof Groups];
