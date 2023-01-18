import { Pubsub } from "../../../../core/src/pubsub/pubsub.js";
import { MessageBus } from '../../../../core/src/pubsub/message-bus.js'
import { PubsubKeepalive } from '../../../../core/src/pubsub/pubsub-keepalive.js'
import { PubsubRateLimit } from '../../../../core/src/pubsub/pubsub-ratelimit.js'
import { LoggerProvider } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import {
  MsgType,
  PubsubMessage,
  QueryMessage,
  ResponseMessage,
  UpdateMessage,
} from '../../../../core/src/pubsub/pubsub-message.js'

describe('cerscan', () => {
  test('sub', async () => {
    await sub();
    await new Promise((r) => setTimeout(r, 19000));
  }, 19000)

  async function sub() {
    const loggerProvider = new LoggerProvider();
    const logger = loggerProvider.getDiagnosticsLogger();
    const pubsubLogger = loggerProvider.makeServiceLogger("pubsub");
    const ipfs = await createIPFS();
    const pubsubTopic = "/ceramic/testnet-clay";
    const IPFS_RESUBSCRIBE_INTERVAL_DELAY = 1000 * 15; // 15 sec
    const MAX_PUBSUB_PUBLISH_INTERVAL = 60 * 1000; // one minute
    const MAX_INTERVAL_WITHOUT_KEEPALIVE = 24 * 60 * 60 * 1000; // one day

    const pubsub = new Pubsub(
      ipfs,
      pubsubTopic,
      IPFS_RESUBSCRIBE_INTERVAL_DELAY,
      pubsubLogger,
      logger
    );
    const messageBus = new MessageBus(
      new PubsubRateLimit(
        new PubsubKeepalive(
          pubsub,
          MAX_PUBSUB_PUBLISH_INTERVAL,
          MAX_INTERVAL_WITHOUT_KEEPALIVE
        ),
        logger,
        10
      )
    );

    messageBus.subscribe((message: PubsubMessage) => { console.log(message) })
  }
}) 