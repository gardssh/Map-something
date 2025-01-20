import { chromium, type Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';

interface CabinDetails {
  name: string;
  url: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  serviceLevel: string;
  capacity: number;
  requiresKey: boolean;
  description: string;
  openingHours: string;
}

async function handleCookieConsent(page: Page) {
  try {
    await page.waitForSelector('#updateButton', { timeout: 5000 });
    await page.click('#updateButton');
    await page.waitForSelector('#coiOverlay', { state: 'hidden', timeout: 5000 });
    console.log('Cookie consent settings saved');
    return true;
  } catch (error) {
    console.log('No cookie popup found or already accepted');
    return false;
  }
}

async function extractCabinInfo(page: Page, url: string): Promise<CabinDetails | null> {
  try {
    await page.goto(url, { timeout: 15000 });
    
    // Handle cookie consent
    await handleCookieConsent(page);
    
    // Get cabin name
    const name = await page.locator('h1').textContent() || '';
    
    // Find the tab container using exact selector
    console.log('Looking for tab container...');
    const tabContainerSelector = '#__next > div > div.PageChromeContent > div.Color--background-white > div.Cabin-page.Container-max-width.Block-padded--bottom > section:nth-child(7) > section > div > div';
    const tabContainer = await page.waitForSelector(tabContainerSelector, { timeout: 15000 });
    
    // Scroll the tab container into view
    console.log('Scrolling to tab container...');
    await tabContainer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Wait a bit for the scroll to complete
    
    // Find and click the Posisjon tab using its class and role
    console.log('Looking for Posisjon tab...');
    
    // Define all possible tab selectors
    const tabSelectors = [
      'li.react-tabs__tab[role="tab"][id^="tab:r"][aria-controls^="panel:r"]:has-text("Posisjon")',
      '#tab\\:R15ra6\\:3',
      '#tab\\:R15ra6\\:4'
    ];

    let foundCoordinates = false;
    let lat = 0, lng = 0;

    for (const selector of tabSelectors) {
      try {
        console.log(`Trying selector: ${selector}`);
        const positionTab = await page.waitForSelector(selector, { timeout: 5000 });
        if (positionTab) {
          console.log(`Found tab with selector: ${selector}`);
          
          // Click the tab and wait for content
          console.log('Clicking tab...');
          await positionTab.click();
          await page.waitForTimeout(1000);

          // Try to find coordinates
          console.log('Looking for coordinates...');
          const coordsText = await page.locator('div.key:has-text("Desimalgrader") + div.value').textContent({ timeout: 5000 });
          console.log('Found coordinates text:', coordsText);

          if (coordsText) {
            // Split the coordinates and parse them
            const [latStr, lngStr] = coordsText.split(',').map(s => s.trim());
            if (latStr && lngStr) {
              lat = parseFloat(latStr);
              lng = parseFloat(lngStr);
              console.log(`Parsed coordinates: { lat: ${lat}, lng: ${lng} }`);
              foundCoordinates = true;
              break; // Found the right tab and coordinates, exit loop
            }
          }
          console.log('No coordinates found in this tab, trying next tab...');
        }
      } catch (e) {
        console.log(`Selector ${selector} not found or no coordinates in tab, trying next...`);
        continue;
      }
    }

    if (!foundCoordinates) {
      console.log('Could not find position tab with coordinates in any selector');
      return null;
    }
    
    // Extract cabin information from the info list
    const infoListSelector = '#__next > div > div.PageChromeContent > div.Color--background-white > div.Cabin-page.Container-max-width.Block-padded--bottom > section.Cabin-page__top-content-wrap.Block-bg--white.Block-pos--relative.Flex-justify--space-between.Flex-row--xl.Flex-column--md.Flex-gap--lg > section > section > div:nth-child(2) > ul';
    await page.waitForSelector(infoListSelector, { state: 'visible', timeout: 15000 });
    const infoList = page.locator(infoListSelector);

    // Get all text content from list items
    const listItems = await infoList.locator('li').all();
    const capacityText = (await Promise.all(listItems.slice(1).map(li => li.textContent()))).filter((text): text is string => text !== null);

    // Get service level from the tag-body class
    const serviceLevel = await listItems[1]?.locator('.tag-body').textContent() || '';
    console.log('Service level:', serviceLevel);

    // Get capacity (number of beds)
    const capacity = capacityText
      .map(text => text.match(/(\d+)\s+sengeplasser/))
      .find(match => match !== null);
    const capacityNumber = capacity ? parseInt(capacity[1]) : 0;
    console.log('Capacity:', capacityNumber);

    // Check if key is required
    const keyInfo = capacityText.find(text => text.toLowerCase().includes('nøkkel')) || '';
    const requiresKey = keyInfo.toLowerCase().includes('spesialnøkkel');
    console.log('Requires key:', requiresKey);

    // Get opening hours
    const openingHours = capacityText.find(text => text.toLowerCase().includes('åpen')) || '';
    console.log('Opening hours:', openingHours);

    // Get description (make it optional)
    let description = '';
    try {
      description = await page.locator('#menu-section-about + div p').first().textContent({ timeout: 5000 }) || '';
      console.log('Description:', description);
    } catch (error) {
      console.log('No description found or timed out getting description');
    }

    return {
      name,
      url,
      coordinates: { lat, lng },
      serviceLevel,
      capacity: capacityNumber,
      requiresKey,
      description,
      openingHours
    };

  } catch (error) {
    console.error('Error extracting cabin info:', error);
    return null;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Read enriched cabins
    const enrichedCabinsPath = path.join(process.cwd(), 'src/data/enriched-cabins.json');
    let enrichedCabins: CabinDetails[] = [];
    try {
      enrichedCabins = JSON.parse(await fs.readFile(enrichedCabinsPath, 'utf-8'));
    } catch (error) {
      console.error('Error reading enriched cabins:', error);
      return;
    }

    // Find cabins that need to be reprocessed (have missing coordinates)
    const cabinsToReprocess = enrichedCabins.map((cabin, index) => ({ ...cabin, index }))
      .filter(cabin => cabin.coordinates.lat === 0);

    console.log(`Found ${cabinsToReprocess.length} cabins with missing coordinates`);

    const batchSize = 100;
    const startIndex = 0;
    const endIndex = Math.min(startIndex + batchSize, cabinsToReprocess.length);

    console.log(`\nProcessing cabins ${startIndex + 1} to ${endIndex} of ${cabinsToReprocess.length}...`);
    
    // Process next batch of cabins
    const currentBatch = cabinsToReprocess.slice(startIndex, endIndex);
    const failedCabins: { name: string; url: string }[] = [];

    // Process each cabin in the batch
    for (let i = 0; i < currentBatch.length; i++) {
      const cabin = currentBatch[i];
      const currentIndex = startIndex + i + 1;
      console.log(`\nProcessing cabin ${currentIndex}/${cabinsToReprocess.length}: ${cabin.name}`);
      
      try {
        const cabinInfo = await extractCabinInfo(page, cabin.url);
        
        if (cabinInfo) {
          // Update the cabin in the original array
          enrichedCabins[cabin.index] = cabinInfo;
          console.log('Successfully processed cabin');
        } else {
          failedCabins.push({ name: cabin.name, url: cabin.url });
          console.log('Failed to process cabin - keeping existing "No data" fields');
        }

        // Save progress after each cabin
        await fs.writeFile(enrichedCabinsPath, JSON.stringify(enrichedCabins, null, 2));
      } catch (error) {
        console.error('Error processing cabin:', error);
        failedCabins.push({ name: cabin.name, url: cabin.url });
        await fs.writeFile(enrichedCabinsPath, JSON.stringify(enrichedCabins, null, 2));
      }

      // Wait a bit between requests to be nice to the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\nProcessed ${currentBatch.length} cabins`);
    console.log(`Total cabins that still need processing: ${cabinsToReprocess.length - endIndex}`);

    // Report failed cabins in this batch
    if (failedCabins.length > 0) {
      console.log('\nFailed to process the following cabins in this batch:');
      failedCabins.forEach(cabin => console.log(`${cabin.name}: ${cabin.url}`));
      console.log(`\nTotal failed in this batch: ${failedCabins.length} cabins`);
    } else {
      console.log('\nAll cabins in this batch were processed successfully!');
    }

    if (endIndex < cabinsToReprocess.length) {
      console.log(`\nRun the script again to process the next batch of cabins (starting from ${endIndex + 1})`);
    } else {
      console.log('\nAll cabins have been processed!');
    }
  } finally {
    await browser.close();
  }
}

main().catch(console.error); 