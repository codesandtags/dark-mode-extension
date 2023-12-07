# Steps to create a Chrome/Brave extension

## 1. Create a new folder for the project

Once you have the folder I recommend the following folder structure

```
.
├── assets  # contains all the assets for the project
│   ├── example-1.png
│   ├── example-2.png
│   ├── example-3.png
├── extension # contains all the files for the extension
│   ├── icons # contains all the icons for the extension
│   │   ├── icon-16.png
│   │   ├── icon-32.png
│   │   ├── icon-48.png
│   │   ├── icon-128.png
│   ├── manifest.json # contains the manifest file for the extension
│   ├── popup # contains all the files for the popup
│   │   ├── popup.html
│   │   ├── popup.css
│   │   ├── popup.js
│   ├── content-script.js # contains the content script for the extension
│   ├── manifest.json # contains the manifest file for the extension
├── .gitignore
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md # security policy for the project
├── privacy-policy.md # privacy policy for the project
```

## Assets folder

The assets folder contains all the assets for the project. It means that it contains all the images, videos, and other files that are not part of the extension.

## Extension folder

The extension folder contains all the files for the extension. All the logic and folder you will send to the Chrome/Brave Web Store will be inside this folder.

## Additional files

The additional files are files that are not part of the extension but are required for the project. These files are:

- `.gitignore`: This file is used to tell Git which files to ignore when you push the project to GitHub.
- `CHANGELOG.md`: This file is used to keep track of all the changes made to the project.
- `CODE_OF_CONDUCT.md`: This file is used to tell the users of the project what is the code of conduct for the project.
- `CONTRIBUTING.md`: This file is used to tell the users of the project how to contribute to the project.
- `LICENSE`: This file is used to tell the users of the project what is the license for the project.
- `README.md`: This file is used to tell the users of the project what is the project about.
- `SECURITY.md`: This file is used to tell the users of the project what is the security policy for the project.
- `privacy-policy.md`: This file is used to tell the users of the project what is the privacy policy for the project.

## 2. Create the manifest file

The manifest file is the file that tells Chrome/Brave what is the name of the extension, the version, the description, the icons, the permissions, and other important information about the extension.

I would suggest to review the [Api Reference](https://developer.chrome.com/docs/extensions/reference) to create the manifest file.

- More details about the [manifest file](https://developer.chrome.com/docs/extensions/mv3/manifest/)

## 3. Create the popup folder and content-script.js file

The popup folder contains all the files for the popup. The popup is the window that appears when you click on the extension icon. It also allows the interaction between the user and the extension (`content-script.js`).

The `content-script.js` file contains the content script for the extension. The content script is the script that is injected into the website. It allows the extension to interact with the website. Here is where you need to put all the logic that you extension needs to work.

## 4. Publish the extension

Once you have the extension ready, you can publish it to the Chrome/Brave Web Store. You can follow the next steps to publish the extension:

- [Publish in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish/): This store works for Chrome and Brave.

The publish process covers a set of sections you need to fill in order to publish the extension. The sections are:

### Product details

This section contains the name, description, and category of the extension.

### Graphic assets

This section contains the images for the extension. You need to upload the following images:

- Store Icon: 128x128px
- Screentshots: Up to a maximum of 5 1280x800 or 640x400 JPEG or 24-bit PNG (no alpha)
- Global promo video: Enter a YouTube video URL. Example: https://www.youtube.com/watch?v=1234567890A
- Small promo tile: 440x280 Canvas JPEG or 24-bit PNG (no alpha)
- Marquee promo tile: 1400x560 Canvas JPEG or 24-bit PNG (no alpha)

I would suggest to put these images/videos or resources in the assets folder at the root of the project.

### Additional fields

- Official website: The official website of the extension.
- Homepage URL: The URL of the extension in the Chrome/Brave Web Store.
- Support URL: The URL of the support page for the extension.
