import axios from 'axios';
import * as cheerio from 'cheerio';
import {
	Client,
	TextChannel,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
	ComponentType,
	Interaction,
} from 'discord.js';
import { Job } from '../types/job';
import DataService from '../services/DataService';
import emojis from '../bot/constants/emojis';

export const checkCourseAvailability: Job = {
	name: 'check-course-availability',
	enabled: false,
	schedule: '*/15 * * * *',
	onStart: true,
	async action(client: Client) {
		const courses = await DataService.getCourses();

		console.log(courses);

		for (const course of courses) {
			try {
				console.log(course);

				const res = await axios.get(
					'https://cab.brown.edu/api/?page=fose&route=details',
					{
						data: { key: `crn:${course.crn}`, srcdb: '999999' },
						headers: {
							'User-Agent':
								'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
						},
					},
				);

				console.log(res.data);

				const courseTitle = res.data['title'];
				const courseCode = res.data['code'];
				const courseSection = res.data['section'];
				const courseTerm = res.data['srcdb'];

				const seatsHTML = res.data['seats'];

				let maxSeats: string = '0';
				let seatsAvail: string = '0';

				// console.log(res.data);

				if (seatsHTML) {
					const $ = cheerio.load(seatsHTML);
					maxSeats = $('.seats_max').text();
					console.log(maxSeats);
					seatsAvail = $('.seats_avail').text();
					console.log(seatsAvail);
				}

				console.log(
					`Course ${courseCode} - ${courseSection}: ${seatsAvail} seats available (max ${maxSeats})`,
				);

				if (!seatsHTML || parseInt(seatsAvail) > 0) {
					const channelId = process.env.COURSE_ALERTS_CHANNEL;
					if (!channelId) {
						console.error('COURSE_ALERTS_CHANNEL is not set.');
						return;
					}

					const channel = client.channels.cache.get(
						channelId,
					) as TextChannel;

					if (!channel) {
						console.error('Course alerts channel not found.');
						return;
					}

					const removeButton = new ButtonBuilder()
						.setCustomId(`remove_course:${course.crn}`)
						.setLabel('Remove')
						.setStyle(ButtonStyle.Danger);

					const linkButton = new ButtonBuilder()
						.setLabel('View Course')
						.setStyle(ButtonStyle.Link)
						.setURL(
							encodeURI(
								`https://cab.brown.edu/?keyword=${courseCode}&srcdb=${courseTerm}`,
							),
						);

					const row =
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							removeButton,
							linkButton,
						);

					let content: string;

					if (!seatsHTML) {
						content = `${emojis.BOT.UPDATE} **Course Available!**\n**\` ${courseCode} \`**\` ${courseSection} \` *${courseTitle}*\n> Course cap has been removed.\n<@${course.ping}>`;
					} else {
						content = `${emojis.BOT.UPDATE} **Course Available!**\n**\` ${courseCode} \`**\` ${courseSection} \` *${courseTitle}*\n> Availability: **${seatsAvail} seats** (max. ${maxSeats})\n<@${course.ping}>`;
					}

					const message = await channel.send({
						content,
						components: [row],
					});

					const collector = message.createMessageComponentCollector({
						componentType: ComponentType.Button,
						time: 30 * 60 * 1000,
					});

					collector.on(
						'collect',
						async (interaction: Interaction) => {
							if (!interaction.isButton()) return;

							if (
								interaction.customId ===
								`remove_course:${course.crn}`
							) {
								if (
									course.ping &&
									interaction.user.id !== String(course.ping)
								) {
									try {
										await interaction.reply({
											content: `Only <@${course.ping}> can remove this alert.`,
											ephemeral: true,
										});
									} catch (err) {
										console.error(
											'Failed to send permission denial reply:',
											err,
										);
									}
									return;
								}
								try {
									await interaction.deferReply({
										ephemeral: true,
									});
									await DataService.removeCourse(course.crn);
									await interaction.editReply({
										content: 'Course removed from alerts.',
									});
									collector.stop();
								} catch (err) {
									console.error(
										'Error removing course:',
										err,
									);
									if (!interaction.replied) {
										await interaction.reply({
											content: 'Failed to remove course.',
											ephemeral: true,
										});
									} else {
										await interaction.editReply(
											'Failed to remove course.',
										);
									}
								}
							}
						},
					);
				}
			} catch (error) {
				console.error(`Error checking course ${course.crn}:`, error);
			}
		}
	},
};
