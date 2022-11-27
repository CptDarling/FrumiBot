const users = require('./users');
var broadcaster_id;
if (!broadcaster_id) {
    
users.getUser('frumious_bandersnatch')
    .then((res) => {
        if (res) {
            console.log('res: ', res);
            broadcaster_id = res.id;
        }
    }, (err) => {
        console.error('res Error: ', err);
    })
    .catch((err) => {
        console.error('catch Error: ', err);
    })
    .finally(() => {
        console.log('broadcaster_id: ', broadcaster_id);
        console.log("finally over");
    });
}

// console.log(data);
// console.log(data[0]);
// const [id] = data[0];
