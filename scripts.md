# Scripts Descriptions

## build

This creates the whole build, by running the following scripts sequentially:

- prepare-content
- build:cms
- build:app
- build:postcss
- build:react-snapshot
- build:sitemap
- build:sw
- build:sha

### build:cms

This essentially creates the JS and CSS files we will need for the custom preview templates. Those files includes the importing of all React components for those templates + their styling, and then registers those templates into the CMS.

The script goes into the `/cms` folder and runs the `build` script in that folder's **package.json**. It creates the files **/public/admin/cms.bundle.js** and **/public/admin/cms.bundle.css**, which is done by running **/cms/cms.js**.

### build:app

This runs Create React App's build script, which will create the `/build` folder.

### build:postcss

This uses the PostCSS CLI to run CSSNext onto the `/build/static/css/*.css` file and overwrite them.

### build:react-snapshot

This runs React Snapshot, which creates static snapshots of our built React app, and saves those snapshots in our `/build` folder.

### build:sitemap

This creates a **sitemap.xml** and **robots.txt** for search engines, using the package `sitemap-static`. It does this by running **/functions/generate-sitemap.js**.

### build:sw

This builds a Service Worker that caches and doesn't cache certain assets. The configuration can be found in **sw-precache-config.js**. It can be modified so that the service worker can cache assets coming from a CDN.

### build:sha

This saves the latest Git commit's SHA into a file (**/build/sha**), **BUT WHY??**.


## start

This starts our app in development mode, by running the following scripts in parallel:

- prepare-content
- start:app
- start:content
- start:cms

### start:app

This runs Create React App's start script, which serves the whole app with Webpack's Dev Server.

### start:content

This starts up Chokidar so that it re-runs the prepare-content script when any file in the **/content/** folder changes.

### start:cms

Similar to `build:cms`, except the output JS is not uglified, and NODE_ENV is equal to development.

This essentially creates the JS and CSS files we will need for the custom preview templates. Those files includes the importing of all React components for those templates + their styling, and then registers those templates into the CMS.

The script goes into the `/cms` folder and runs the `build` script in that folder's **package.json**. It creates the files **/public/admin/cms.bundle.js** and **/public/admin/cms.bundle.css**, which is done by running **/cms/cms.js**.


## prepare-content

This sets up our site data and resizes our images to optimize them for multiple screen sizes, by running the following scripts sequentially:

- parse-content
- resize-images

### parse-content

This outputs the data of all our collection types into a single JSON file, by running the Node script **/functions/parse-content.js**. The structure of this JSON object is:

```js
let structure = {
  [collectionTypeA]: [
    { /* collectionObj1 */ },
    { /* collectionObj2 */ },
    // etc.
  ],
  [collectionTypeB]: [
    { /* collectionObj1 */ },
    { /* collectionObj2 */ },
    // etc.
  ],
  [collectionTypeC]: [
    { /* collectionObj1 */ },
    { /* collectionObj2 */ },
    // etc.
  ],
  // etc.
};
```

### resize-images

This makes sure all uploaded images files are resized to our desired sizes, unless the imgix API is being used instead by running the Node script **/functions/resize-images.js**.

