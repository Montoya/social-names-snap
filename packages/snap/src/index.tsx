import type {
  DomainResolution,
  OnNameLookupHandler,
  OnInstallHandler
} from '@metamask/snaps-sdk';
import { Box, Heading, Text, Bold, Italic, Divider } from "@metamask/snaps-sdk/jsx";

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
            resolvedDomain: `@${item.username} on Farcaster`, // eslint-disable-line @typescript-eslint/restrict-template-expressions
            protocol: 'Farcaster',
          });
        });
      }

      if (resolvedDomains.length) {
        return { resolvedDomains };
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }

  if (domain) {
    if (domain.startsWith('farcaster:') || domain.startsWith('fc:')) {
      const fcName = domain.split(':')[1];
      console.log(fcName);
      if (!fcName || !/^[a-z0-9][a-z0-9-]{0,15}$/.test(fcName)) {
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

      console.log(json); 

      if (json.user) {
        const foundUser = json.user;
        if (foundUser.username === fcName) {
          if (foundUser.verified_addresses?.eth_addresses?.length) {
            const foundAddress = foundUser.verified_addresses.eth_addresses[0];
            return {
              resolvedAddresses: [
                {
                  resolvedAddress: foundAddress,
                  protocol: 'Farcaster',
                  domainName: fcName,
                },
              ],
            };
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
          <Heading>Installation successful 🎉</Heading>
          <Text>
            MetaMask is now supercharged with support for Farcaster names (fnames). From now on, when sending on any EVM network, you can type either of the following to resolve fnames:.
          </Text>
          <Divider/>
          <Text><Bold>farcaster:</Bold>username</Text>
          <Text><Bold>fc:</Bold>username</Text>
          <Divider/>
          <Text>
            When there are valid matches, you will be shown suggested addresses. <Italic>Please always take a moment to double check names and addresses.</Italic>
          </Text>
        </Box>
      ),
    },
  });
};
