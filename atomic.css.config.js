module.exports = {
    cssDest: './src/style/atomic.css',
    options: {
        // namespace: '#atomic',
    },
    configs: {
        "breakPoints": {
        'xm': '@media(min-width:0)',
        'sm': '@media(min-width:576px)',
        'md': '@media(min-width:768px)',
        'lg': '@media(min-width:992px)',
        'xl': '@media(min-width:1200px)',
        'Msm': '@media(max-width:576px)',
        'Mmd': '@media(max-width:768px)',
        'Mlg': '@media(max-width:992px)',
        'Mxl': '@media(max-width:1200px)',
    },
        "custom": {
           'content': '\'\'',
           'border_bottom': '1px solid gray',
           'box_shadow': '0 10px 10px #aaa'
        },
        "classNames": [

        ]
    },
    rules: [
        {
            "type": "pattern",
            "name": "gap",
            "matcher": "MinMaxW",
            "allowParamToValue": true,
            "styles": {
                "min-width": "$0",
                "max-width": "$1"
            }
        }
    ],
    helpers: {
        '$Container': () => [
            'M(a)',
            'W(100%)--xm',
            'Maw(540px)--sm',
            'Maw(720px)--md',
            'Maw(960px)--lg',
            'Maw(1140px)--xl'
        ],
        '$Centre': (pram)=> {
            if (pram === '::b' || pram === '::a') {
                return ['Pos(r)',`Pos(a)${pram}`,`T(50%)${pram}`,`Start(50%)${pram}`,`Translate(-50%,-50%)${pram}`]
            }
        },
        '$Layout': (type, break_points, value) => {
            if (break_points === 'full') {
                break_points = ['sm', 'md', 'lg', 'xl'];
            }

            const classes = []
            classes.push(`W(1/${value})--xm`);
            break_points.forEach((bp, i) => {
                classes.push(`W(1/${((i + 1) * type) + value})--${bp}`)
            });
            return classes;

        }
    }
}