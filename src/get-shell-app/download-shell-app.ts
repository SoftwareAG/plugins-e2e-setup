import * as fs from 'fs';
import axios from 'axios';

type ZippedFileName = string;

/**
 * Downloads the shell app from the given file URL and returns downloaded file name.
 * @param shellVersion The shell version to download.
 * @returns The name of the downloaded file.
 */
export async function downloadShellApp(
	shellVersion: string
): Promise<ZippedFileName> {
	const fileUrl = `https://resources.cumulocity.com/webapps/ui-releases/apps-${shellVersion}.tgz`;
	const fallbackFileUrl = `https://staging-resources.cumulocity.com/webapps/ui-releases/apps-${shellVersion}.tgz`;
	console.log(`Shell file url is: ${fileUrl}`);
	console.log(`Shell file fallback url is: ${fallbackFileUrl}`);

	try {
		const tgzFile = `apps-${shellVersion}.tgz`;
		await downloadFile(fileUrl, fallbackFileUrl, tgzFile);
		if (!fs.existsSync(tgzFile)) {
			throw new Error('Downloaded file not found!');
		}
		console.log('File downloaded successfully.');
		return tgzFile;
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

/**
 * Downloads the file from the given URL and saves it to the given output path.
 * If the download from the first URL fails, it attempts to download from the fallback URL.
 * @param url The URL of the file to download.
 * @param fallbackUrl The fallback URL of the file to download.
 * @param outputPath The path to save the downloaded file.
 */
async function downloadFile(
	url: string,
	fallbackUrl: string,
	outputPath: string
): Promise<void> {
	const writer = fs.createWriteStream(outputPath);

	try {
		const response = await axios({
			url,
			method: 'GET',
			responseType: 'stream'
		});

		response.data.pipe(writer);

		await new Promise((resolve, reject) => {
			writer.on('finish', resolve);
			writer.on('error', reject);
		});
	} catch (_) {
		console.error(
			`Failed to download from ${url}. Attempting fallback URL ${fallbackUrl}`
		);
		const writerFallback = fs.createWriteStream(outputPath);

		const responseFallback = await axios({
			url: fallbackUrl,
			method: 'GET',
			responseType: 'stream'
		});

		responseFallback.data.pipe(writerFallback);

		await new Promise((resolve, reject) => {
			writerFallback.on('finish', resolve);
			writerFallback.on('error', reject);
		});
	}
}
