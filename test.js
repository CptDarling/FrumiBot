const clips = require('./clips');
const users = require('./users');

users.getUser('jackie_codes')
    .then((res) => {
        if (res) {
            // console.log(res);
            var broadcaster_id = res.id;
            // console.log('broadcaster_id: ', broadcaster_id)

            clips.refreshData(broadcaster_id)
            .then((res) => console.log('res: ', res));

        }
        // clips.fetch()
        //     .then((res) => {
        //         if (res) {
        //             console.log('res: ', res);
        //         }
        //     }, (err) => {
        //         console.error('res Error: ', err);
        //     })
        //     .catch((err) => {
        //         console.error('catch Error: ', err);
        //     })
        //     .finally(() => {
        //         console.log("finally over");
        //     });
    });
