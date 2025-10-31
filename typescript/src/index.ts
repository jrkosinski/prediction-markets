import axios from 'axios';

const url1 = 'https://clob.polymarket.com/markets';
const url2 = 'https://gamma-api.polymarket.com';
const url3 = 'https://gamma-api.polymarket.com/sports';

class Polymarket {
    public static async aggregateSportsTags(): Promise<string[]> {
        const response = await axios.get(
            'https://gamma-api.polymarket.com/sports'
        );
        const results = response.data;
        const tags: string[] = [];

        for (let result of results) {
            if (result.tags) {
                const tempTags: string[] = result.tags.toString().split(',');
                for (let tag of tempTags) {
                    tag = tag.trim();
                    if (!tags.find((t) => t === tag)) {
                        tags.push(tag);
                    }
                }
            }
        }

        return tags;
    }

    public static async getTags(): Promise<any[]> {
        const response = await axios.get(
            'https://gamma-api.polymarket.com/tags?limit=10000'
        );
        const results = response.data;
        return results.map((r: any) => r.label).sort();
    }

    public static async getMarketsByTag(tag: string): Promise<any[]> {
        const response = await axios.get(
            'https://gamma-api.polymarket.com/markets?order=id&ascending=false&closed=false&limit=100&tags&tag_id=' +
                tag
        );

        return response.data;
    }
}

class Kalshi {
    public static async getMarkets(
        limit: number = 1000,
        status: string = '',
        from: number = 0,
        to: number = 0
    ): Promise<any[]> {
        let url = `https://api.elections.kalshi.com/trade-api/v2/markets?limit=${limit}`;
        if (from) url += `&min_close_ts=${from}`;
        if (to) url += `&max_close_ts=${to}`;
        if (status.length) url += `&status=${status}`;

        console.log('getting', url);

        let response = await axios.get(url);
        let cursor = '';
        let output: any = response.data.markets;

        cursor = response.data.cursor;
        while (cursor?.length) {
            console.log('getting next page', cursor);
            response = await axios.get(`${url}&cursor=${cursor}`);
            output = output.concat(output, response.data.markets);
            cursor = response.data.cursor;
            if (output.length >= 10000000) break;
        }

        return output;
    }

    public static async getMarketByTicker(ticker: string): Promise<any> {
        const response = await axios.get(
            `https://api.elections.kalshi.com/trade-api/v2/market/${ticker}`
        );

        return response.data;
    }
}

function getUnixTimestamp() {
    return Math.floor(Date.now() / 1000);
}

function toUnixTimestamp(date: Date) {
    return Math.floor(date.getTime() / 1000);
}

async function main() {
    /*
    console.log('predmarket');
    const response1 = await axios.get(
        'https://gamma-api.polymarket.com/markets?order=id&ascending=false&closed=false&limit=100'
    );
    const response2 = await axios.get(
        'https://gamma-api.polymarket.com/events?order=id&ascending=false&closed=false&limit=100'
    );
    const response3 = await axios.get(url3);
    */
    //const tags = await getTags();
    //const sportsTags = await Polymarket.aggregateSportsTags();
    //for (let tag of sportsTags) {
    //    const sportsMarkets = await Polymarket.getMarketsByTag(tag);
    //    console.log(tag, 'has', sportsMarkets.length, 'markets.');
    //}

    const markets = await Kalshi.getMarkets(
        1000,
        'closed'
        //toUnixTimestamp(new Date(2025, 8, 15)),
        //toUnixTimestamp(new Date(2025, 10, 10))
    );
    console.log(markets.length);

    for (let market of markets) {
        if (market.open_interest > 0) {
            //console.log(market.event_ticker);

            if (
                market.event_ticker.startsWith('KXMVENFL') ||
                market.event_ticker.startsWith('KXNFL')
            ) {
                //console.log(market.event_ticker);
                //console.log(market.title);
                //console.log(market);

                if (market.title.toLowerCase().indexOf('boston') >= 0)
                    console.log(market);
            }
            if (market.event_ticker == 'KXMVENFLSINGLEGAME-S20250C743BCFDD1')
                console.log(market);
        }
    }

    return;
    console.log(await Kalshi.getMarketByTicker('kxnflgame-25nov02atlne'));
}

main();
