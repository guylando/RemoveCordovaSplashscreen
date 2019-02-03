module.exports = function(ctx) {
    var fs = ctx.requireCordovaModule('fs');
    var path = ctx.requireCordovaModule('path');
    var events = ctx.requireCordovaModule('cordova-common').events;
    var is_android = ctx.opts.platforms.length === 1 && ctx.opts.platforms[0] === 'android';
    var res_dir;
    if (is_android) {
        res_dir = path.join(ctx.opts.projectRoot, 'platforms/android/app/src/main/res');
    }
    else {
        folders = fs.readdirSync(path.join(ctx.opts.projectRoot, 'platforms/ios'));
        for (const folder of folders) {
            events.emit('verbose', 'cleanSplashAndIcons.js hook, folder: ' + folder);
            /* Find {appname}.xcworkspace folder and extract app name from it */
            if (folder.endsWith('.xcworkspace')) {
                var appname = folder.split('.')[0];
                res_dir = path.join(ctx.opts.projectRoot, 'platforms/ios/' + appname + '/Images.xcassets');
                break;
            }
        }

        if (!res_dir) {
            throw 'did not find res_dir for ios platform';
        }
    }

    /* Loop over res folders deleting png files from subfolders */
    fs.readdir(res_dir, (err, subfolders) => {
        if (err) throw err;

        for (const subfolder of subfolders) {
            let curr_subfolder_path = path.join(res_dir, subfolder);
            /* Make sure its a folder and not a file */
            if (fs.lstatSync(curr_subfolder_path).isDirectory()) {
                fs.readdir(curr_subfolder_path, (err, files) => {
                    if (err) throw err;

                    for (const file of files) {
                        /* Delete png files */
                        if (file.endsWith('.png')) {
                            let file_path = path.join(curr_subfolder_path, file);
                            events.emit('verbose', 'cleanSplashAndIcons.js hook, deleting: ' + file_path);
                            fs.unlink(file_path, err => {
                                if (err) throw err;
                            });
                        }
                    }
                });
            }
        }
    });
}
