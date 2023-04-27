const axios = require('axios')
const fs = require('fs')

const addresses = [
  '0xa3f558aebaecaf0e11ca4b2199cc5ed341edfd74',
  '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
  '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed',
  '0x4585fe77225b41b697c938b018e2ac67ac5a20c0',
  '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36',
  '0x5777d92f208679db4b9778590fa3cab3ac9e2168',
  '0xc63b0708e2f7e69cb8a1df0e1389a98c35a76d52',
  '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35',
  '0x7379e81228514a1d2a6cf7559203998e20598346',
  '0x6c6bc977e13df9b0de53b251522280bb72383700',
  '0x11b815efb8f581194ae79006d24e0d814b7697f6',
  '0x3416cf6c708da44db2624d63ea0aaef7113527c6',
  '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
  '0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8',
  '0x1d42064fc4beb5f8aaf85f4617ae8b3b5b8bd801',
  '0xa6cc3c2531fdaa6ae1a3ca84c2855806728693e8',
  '0x290a6a7460b308ee3f19023d2d00de604bcf5b42',
  '0x5c128d25a21f681e678cb050e551a895c9309945',
  '0x97e7d56a0408570ba1a7852de36350f7713906ec',
  '0xc5af84701f98fa483ece78af83f11b6c38aca71d',
  '0x64a078926ad9f9e88016c199017aea196e3899e1',
  '0x69d91b94f0aaf8e8a2586909fa77a5c2c89818d5',
  '0x7bea39867e4169dbe237d55c8242a8f2fcdcc387',
  '0xac4b3dacb91461209ae9d41ec517c2b9cb1b7daf',
  '0x7858e59e0c01ea06df3af3d20ac7b0003275d4bf',
  '0x840deeef2f115cf50da625f7368c24af6fe74410',
  '0x60594a405d53811d3bc4766596efd80fd545a270',
  '0x9db9e0e53058c89e5b94e29621a205198648425b',
  '0xf56d08221b5942c428acc5de8f78489a97fc5599',
  '0xe42318ea3b998e8355a3da364eb9d48ec725eb45',
  '0x40e629a26d96baa6d81fae5f97205c2ab2c1ff29',
  '0xe8c6c9227491c0a8156a0106a0204d881bb7e531',
  '0x5764a6f2212d502bc5970f9f129ffcd61e5d7563',
  '0x4b5ab61593a2401b1075b90c04cbcdd3f87ce011',
  '0x99132b53ab44694eeb372e87bced3929e4ab8456',
  '0x3b685307c8611afb2a9e83ebc8743dc20480716e',
  '0xc2a856c3aff2110c1171b8f942256d40e980c726',
  '0x9e0905249ceefffb9605e034b534544684a58be6',
  '0xf4ad61db72f114be877e87d62dc5e7bd52df4d9b',
  '0xe15e6583425700993bd08f51bf6e7b73cd5da91b',
  '0x824a30f2984f9013f2c8d0a29c0a3cc5fd5c0673',
  '0xa4e0faa58465a2d369aa21b3e42d43374c6f9613',
  '0x87986ae1e99f99da1f955d16930dc8914ffbed56',
  '0xb9044f46dcdea7ecebbd918a9659ba8239bd9f37',
  '0x992f534fcc87864875224d142d6bf054b1882160',
  '0xcd8286b48936cdac20518247dbd310ab681a9fbf',
]

const mintsQuery = `
query mints($address: String!, $minTimestamp: Int!, $count: Int!){
  mints(where: {timestamp_gt: $minTimestamp timestamp_lt: 1662104943 pool: $address } first:$count orderBy: timestamp orderDirection:asc) {
    timestamp
    transaction {
      id
    }
  }
}
`

const burnsQuery = `
query burns($address: String!, $minTimestamp: Int!, $count: Int!){
  burns(where: {timestamp_gt: $minTimestamp timestamp_lt: 1662104943 pool: $address } first:$count orderBy: timestamp orderDirection:asc) {
    timestamp
    transaction {
      id
    }
  }
}
`

const swapsQuery = `
query swaps($address: String!, $minTimestamp: Int!, $count: Int!){
  swaps(where: {timestamp_gt: $minTimestamp timestamp_lt: 1662104943 pool: $address } first:$count orderBy: timestamp orderDirection:asc) {
    timestamp
    transaction {
      id
    }
  }
}
`

const queries: { query: string; key: 'mints' | 'swaps' | 'burns' }[] = [
  { query: mintsQuery, key: 'mints' },
  { query: burnsQuery, key: 'burns' },
  { query: swapsQuery, key: 'swaps' },
]
// const queries: { query: string; key: 'mints' | 'swaps' | 'burns' }[] = [{ query: swapsQuery, key: 'swaps' }]

// open a file for reading and writing (creating it if it doesn't exist)
const validatedFilePath = './scripts/validated.txt'
const invalidFilePath = './scripts/invalid.txt'
const validated = fs.readFileSync(validatedFilePath, 'utf8').split('\n')
const invalid = fs.readFileSync(invalidFilePath, 'utf8').split('\n')

const countPerQuery = 1000
const startTime = 1661759343
const payload = {
  operationName: 'poolDayDatas',
}

const goldskyApi = 'https://api.goldsky.com/api/public/project_cl7gjtydo00g30hx10fzo6f8z/subgraphs/uniswap-v3/1.0.0/gn'
const graphNodeApi = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'

type TransactionEvents = Array<{ timestamp: string; transaction: { id: string } }>

async function runGraphqlQuery(
  endpoint: string,
  address: string,
  query: string,
  minTimestamp: number,
  count: number
): Promise<{
  data: {
    data: {
      mints: TransactionEvents
      swaps: TransactionEvents
      burns: TransactionEvents
    }
    errors?: Array<{ message: string }>
  }
}> {
  return await axios.post(
    endpoint,
    {
      ...payload,
      query,
      variables: {
        minTimestamp,
        address,
        count,
      },
    },
    {
      headers: {
        accept: 'application/json, multipart/mixed',
        'content-type': 'application/json',
      },
    }
  )
}

function validateTransactions(goldskyTransactions: Set<string>, thegraphTransactions: Set<string>) {
  let isValid = true
  const transactionsMissingFromGoldsky = new Set()
  const transactionsMissingFromThegraph = new Set()

  for (const transaction of goldskyTransactions) {
    if (!thegraphTransactions.has(transaction)) {
      transactionsMissingFromThegraph.add(transaction)
      isValid = false
    }
  }

  for (const transaction of thegraphTransactions) {
    if (!goldskyTransactions.has(transaction)) {
      transactionsMissingFromGoldsky.add(transaction)
      isValid = false
    }
  }
  console.log(`transactions missing from goldsky`, transactionsMissingFromGoldsky)
  console.log(`transactions missing from thegraph`, transactionsMissingFromThegraph)
  console.log('validation finished')
  return isValid
}

async function getTransactions(address: string, query: string, key: 'mints' | 'burns' | 'swaps', endpoint: string) {
  let minTimestamp = startTime

  const transactionIds = new Set<string>()
  while (true) {
    try {
      const result = await runGraphqlQuery(endpoint, address, query, minTimestamp, countPerQuery)

      if (result.data.errors) {
        console.log('encountered error, trying again')
        console.log(result.data.errors)
        continue
      }
      result.data.data[key].map((event) => {
        transactionIds.add(event.transaction.id)
      })
      if (result.data.data[key].length < countPerQuery) {
        break
      }

      minTimestamp = parseInt(result.data.data[key][result.data.data[key].length - 1].timestamp)
    } catch (e) {
      console.log('encountered error, trying again')
      console.log(e)
    }
  }

  return transactionIds
}

async function main() {
  for (const address of addresses) {
    console.log(`checking address ${address}`)
    for (const query of queries) {
      console.log(`checking query ${query.key}`)
      const key = `${address}-${query.key}`
      if (validated.includes(key)) {
        console.log('already validated')
        continue
      }
      if (invalid.includes(key)) {
        console.log('already invalid')
        continue
      }
      const [goldskyTransactions, thegraphTransactions] = await Promise.all([
        getTransactions(address, query.query, query.key, goldskyApi),
        getTransactions(address, query.query, query.key, graphNodeApi),
      ])
      const isValid = validateTransactions(goldskyTransactions, thegraphTransactions)

      if (isValid) {
        validated.push(key)
        fs.writeFileSync(validatedFilePath, validated.join('\n'))
      } else {
        invalid.push(key)
        fs.writeFileSync(invalidFilePath, invalid.join('\n'))
      }
    }
    // const results = await Promise.all(promises)

    // if (JSON.stringify(results[0]) !== JSON.stringify(results[1])) {
    //   console.log(`address: ${address} results are different`)
    //   const transactionsInFirst = new Set()
    //   const transactionsInSecond = new Set()
    //   const keys = ['mints', 'swaps', 'collects']
    //   for (let j = 0; j < results[0].poolDayDatas.length; j++) {
    //     const first = results[0].poolDayDatas[j]
    //     const second = results[1].poolDayDatas[j]
    //     for (const key of keys) {
    //       const firstTransactions = first.pool[key].map((item: any) => item.transaction.id)
    //       const secondTransactions = second.pool[key].map((item: any) => item.transaction.id)
    //       for (const transaction of firstTransactions) {
    //         if (!secondTransactions.includes(transaction)) {
    //           transactionsInFirst.add(transaction)
    //         }
    //       }
    //       for (const transaction of secondTransactions) {
    //         if (!firstTransactions.includes(transaction)) {
    //           transactionsInSecond.add(transaction)
    //         }
    //       }
    //     }
    //   }
    //   console.log(`transactions in first`, transactionsInFirst)
    //   console.log(`transactions in second`, transactionsInSecond)
    // }
  }
}

main()
  .then(() => console.log('done'))
  .catch(console.error)

export {}
