/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import firebase from '@firebase/app';
import { CONSTANTS, isNodeSdk } from '@firebase/util';
import { FirebaseApp, FirebaseNamespace } from '@firebase/app-types';
import { _FirebaseNamespace } from '@firebase/app-types/private';
import { Database } from './src/api/Database';
import { DataSnapshot } from './src/api/DataSnapshot';
import { Query } from './src/api/Query';
import { Reference } from './src/api/Reference';
import { enableLogging } from './src/core/util/util';
import { RepoManager } from './src/core/RepoManager';
import * as INTERNAL from './src/api/internal';
import * as TEST_ACCESS from './src/api/test_access';
import './src/nodePatches';
import * as types from '@firebase/database-types';

/**
 * A one off register function which returns a database based on the app and
 * passed database URL.
 *
 * @param app A valid FirebaseApp-like object
 * @param url A valid Firebase databaseURL
 */

const ServerValue = Database.ServerValue;

export function initStandalone(
  app: FirebaseApp,
  url: string,
  version?: string
) {
  /**
   * This should allow the firebase-admin package to provide a custom version
   * to the backend
   */
  CONSTANTS.NODE_ADMIN = true;
  if (version) {
    firebase.SDK_VERSION = version;
  }

  return {
    instance: RepoManager.getInstance().databaseFromApp(app, url),
    namespace: {
      Reference,
      Query,
      Database,
      DataSnapshot,
      enableLogging,
      INTERNAL,
      ServerValue,
      TEST_ACCESS
    }
  };
}

export function registerDatabase(instance: FirebaseNamespace) {
  // Register the Database Service with the 'firebase' namespace.
  const namespace = (instance as _FirebaseNamespace).INTERNAL.registerService(
    'database',
    (app, unused, url) => RepoManager.getInstance().databaseFromApp(app, url),
    // firebase.database namespace properties
    {
      Reference,
      Query,
      Database,
      DataSnapshot,
      enableLogging,
      INTERNAL,
      ServerValue,
      TEST_ACCESS
    },
    null,
    true
  );

  if (isNodeSdk()) {
    module.exports = Object.assign({}, namespace, { initStandalone });
  }
}

registerDatabase(firebase);

// Types to export for the admin SDK
export { Database, Query, Reference, enableLogging, ServerValue };

export { DataSnapshot } from './src/api/DataSnapshot';
export { OnDisconnect } from './src/api/onDisconnect';

declare module '@firebase/app-types' {
  interface FirebaseNamespace {
    database?: {
      (app?: FirebaseApp): types.FirebaseDatabase;
      enableLogging: typeof types.enableLogging;
      ServerValue: types.ServerValue;
      Database: typeof types.FirebaseDatabase;
    };
  }
  interface FirebaseApp {
    database?(): types.FirebaseDatabase;
  }
}
