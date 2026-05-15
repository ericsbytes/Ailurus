import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import axios from 'axios';
import * as cheerio from 'cheerio';


class AO3Service {
	private jar = new CookieJar();
	client = wrapper(
		axios.create({
			jar: this.jar,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:150.0) Gecko/20100101 Firefox/150.0',
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.5',
				Connection: 'keep-alive',
			},
		}),
	);

	async login(username: string, password: string) {
		const res = await this.client.get(
			'https://archiveofourown.org/users/login',
		);
		const $ = cheerio.load(res.data);
		const csrfToken = $('input[name="authenticity_token"]').val() as string;

		console.log('Logging in to AO3...');
		console.log(csrfToken);

		await this.client.post(
			'https://archiveofourown.org/users/login',
			new URLSearchParams({
				'user[login]': username,
				'user[password]': password,
				authenticity_token: csrfToken,
			}),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				maxRedirects: 0,
				validateStatus: status => status < 400,
			},
		);
	}
}

export default AO3Service;
