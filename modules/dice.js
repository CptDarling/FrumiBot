
exports.diceRoll = function (sides = '1d6') {
    var resp = "";

    var rpg = sides.split('d');
    if (rpg.length > 1) {
        const die = rpg[0];
        const sides = rpg[1];
        if (die > 6) {
            return "I can't roll more than 6 dice!";
        } else if (die <= 0) {
            return "Yo, momma!";
        }
        if (sides <= 0) {
            return "That's physically impossible!"
        }
        for (var i = 1; i <= die - 1; i++) {
            if (resp.length === 0) {
                resp = roll(sides);
            } else {
                resp = resp + ', ' + roll(sides);
            }
        }
        if (resp.length === 0)
        {
            resp = roll(sides);
        } else {
            resp = resp + ' and ' + roll(sides);
        }
        resp = `rolled ${resp} with ${die}d${sides}`;
    } else {
        var sides = rpg[0];
        resp = roll(sides);
    }

    return resp;

}

function roll(sides) {
    return Math.floor(Math.random() * sides) + 1
}