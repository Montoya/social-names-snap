import type {
  DomainResolution,
  OnNameLookupHandler,
  OnInstallHandler
} from '@metamask/snaps-sdk';
import { Box, Section, Heading, Text, Bold, Italic, Divider } from "@metamask/snaps-sdk/jsx";

export const onNameLookup: OnNameLookupHandler = async (request) => { 
  const { address, domain } = request;

  if (address) {
    const resolvedDomains: DomainResolution[] = [];

    const optionsNeynar = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        api_key: atob('NDY3RUJBRUEtOTM2Mi00M0U2LUI3OEUtRTU2ODZCQTlENTUy'), // eslint-disable-line @typescript-eslint/naming-convention
      },
    };

    const fetchNeynar = fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
      optionsNeynar,
    ).then(async (response) => await response.json());

    try {
      const results = await Promise.allSettled([fetchNeynar]);

      const jsonNeynar =
        results[0].status === 'fulfilled' ? results[0].value : null;

      if (jsonNeynar[address]) {
        jsonNeynar[address].forEach((item: any) => {
          resolvedDomains.push({
            resolvedDomain: `@${item.username} | ${item.display_name}`, // eslint-disable-line @typescript-eslint/restrict-template-expressions
            protocol: 'Farcaster',
          });
        });
      }

      if (resolvedDomains.length) {
        return { resolvedDomains };
      }
    } catch (error) {
      /* console.error('Unexpected error:', error); do not surface errors in prod */
    }
  }

  if (domain) {
    let fcName:string = domain;
    if (domain.endsWith('.farcaster')) {
      fcName = fcName.replace('.farcaster',''); 
    } 
    else if (domain.endsWith('.fc')) { 
      fcName = fcName.replace('.fc',''); 
    }
    else if (domain.endsWith('.fcast.id')) { 
      fcName = fcName.replace('.fcast.id',''); 
    }
    else { 
      return null; 
    }
    if(fcName.endsWith('.eth')) { 
      let ensName = fcName.replace('.eth',''); 
      if (!/^[a-z0-9][a-z0-9-]{0,15}$/.test(ensName)) {
        return null;
      }
    }
    else if (!/^[a-z0-9][a-z0-9-]{0,15}$/.test(fcName)) {
      return null;
    }

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        api_key: atob('NDY3RUJBRUEtOTM2Mi00M0U2LUI3OEUtRTU2ODZCQTlENTUy'), // eslint-disable-line @typescript-eslint/naming-convention
      },
    };

    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by_username?username=${fcName}`,
      options,
    );
    const json = await response.json();

    if (json.user) {
      const foundUser = json.user;
      if (foundUser.username === fcName) {
        const resolvedAddresses:any[] = []; 
        if(foundUser.custody_address) { 
          resolvedAddresses.push({
            resolvedAddress: foundUser.custody_address,
            protocol: `Farcaster Wallet Address`,
            domainName: fcName
          });
        }
        if(foundUser.verified_addresses?.eth_addresses?.length) {
          const foundAddresses = foundUser.verified_addresses.eth_addresses; 
          foundAddresses.forEach((address:string, index:number) => {
            if(0 === index) { 
              resolvedAddresses.push({
                resolvedAddress: address,
                protocol: 'Farcaster Verified Address',
                domainName: fcName
              });
            }
            else { 
              let count = index + 1; 
              resolvedAddresses.push({
                resolvedAddress: address,
                protocol: `Farcaster Verified Address ${count}`,
                domainName: fcName
              });
            }
          });
        }
        if(resolvedAddresses.length) { 
          return {
            resolvedAddresses: resolvedAddresses
          }
        }
      }
    }
  }

  return null;
};

export const onInstall: OnInstallHandler = async () => {
  await snap.request({
    method: "snap_dialog",
    params: {
      type: "alert",
      content: (
        <Box>
          <Section>
            <Heading>Installation successful 🎉</Heading>
            <Text>
              You can now use Farcaster names! 
              When sending on any EVM network, you can type:
            </Text>
            <Divider/>
            <Text>username<Bold>.farcaster</Bold></Text>
            <Text>username<Bold>.fc</Bold></Text>
            <Text>username<Bold>.fcast.id</Bold></Text>
            <Divider/>
            <Text>
              If there are matches, you will see valid addresses, including the user's Farcaster wallet address and any additional verified addresses.
            </Text>
            <Text>
              If a Farcaster user has a .eth username, you can type it like this: <Bold>username.eth.fc</Bold>
            </Text>
            <Text>
              <Italic> Always take a moment to double check names and addresses.</Italic>
            </Text>
          </Section>
        </Box>
      ),
    },
  });
};
