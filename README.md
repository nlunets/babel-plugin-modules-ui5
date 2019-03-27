# babel-plugin-modules-ui5

Plugin to transpile es6 imports into ui5 style AMD.

**Experimental**

To use just reference this project and add this as a plugin with

```js
plugins: [["babel-plugin-modules-ui5", {
    strict: true,
    noInterop: true
}]]
```

### Trying it out

- Pull this repo
- `yarn install`
- `yarn run build`
- `yarn link`
- Pull https://github.com/nlunets/my-es6-ui5-app
- `yarn link "babel-plugin-modules-ui5"`
- `yarn run start` (or npm or whatever)