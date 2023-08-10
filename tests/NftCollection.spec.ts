import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { toNano } from 'ton-core';
import { NftCollection } from '../wrappers/NftCollection';
import '@ton-community/test-utils';
import { NftItem } from '../wrappers/NftItem';

describe('NftCollection', () => {
    let blockchain: Blockchain;
    let nftCollection: SandboxContract<NftCollection>;
    let deployer: SandboxContract<TreasuryContract>;
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        const content = "I Promise NFT Collection";
        nftCollection = blockchain.openContract(await NftCollection.fromInit(content));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await nftCollection.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and nftCollection are ready to use
    });

    it("should mint nft", async()=>{
        
        const res = await nftCollection.send(deployer.getSender(), {
            value: toNano("0.3")
        }, 'Mint')

        const nftItemAddress = await nftCollection.getGetNftAddressByIndex(0n);
        const nftItem: SandboxContract<NftItem> = blockchain.openContract(NftItem.fromAddress(nftItemAddress!))

        const buyer = await blockchain.treasury("buyer");
        await nftItem.send(deployer.getSender(), {
            value: toNano("0.2")
        }, {
            $$type: 'Transfer',
            new_owner: buyer.address,
            query_id: 0n
        })

        const nftItemData = await nftItem.getGetItemData();
        expect(nftItemData.owner).toEqualAddress(buyer.address);
    })
});