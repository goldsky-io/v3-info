import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import gql from 'graphql-tag'
import { PoolChartEntry } from 'state/pools/reducer'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'

// format dayjs with the libraries that we need
dayjs.extend(utc)
dayjs.extend(weekOfYear)
const ONE_DAY_UNIX = 24 * 60 * 60

const POOL_CHART = gql`
  query poolDayDatas($startTime: Int!, $skip: Int!, $address: Bytes!) {
    poolDayDatas(
      first: 1000
      skip: $skip
      where: { pool: $address, date_gt: $startTime }
      orderBy: date
      orderDirection: asc
      subgraphError: allow
    ) {
      date
      volumeUSD
      tvlUSD
      feesUSD
      pool {
        feeTier
      }
    }
  }
`

interface ChartResults {
  poolDayDatas: {
    date: number
    volumeUSD: string
    tvlUSD: string
    feesUSD: string
    pool: {
      feeTier: string
    }
  }[]
}

export async function fetchPoolChartData(address: string, client: ApolloClient<NormalizedCacheObject>) {
  let data: {
    date: number
    volumeUSD: string
    tvlUSD: string
    feesUSD: string
    pool: {
      feeTier: string
    }
  }[] = []
  const startTimestamp = 1619170975
  const endTimestamp = dayjs.utc().unix()

  let error = false
  let skip = 0
  let allFound = false

  try {
    while (!allFound) {
      console.log('fetching pool chart data', skip, startTimestamp, address)
      /*
      the above prints the following with our endpoint:
      fetching pool chart data 0 1619170975 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
chartData.ts:65 fetching pool chart data 0 1619170975 0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8
chartData.ts:65 fetching pool chart data 0 1619170975 0xcbcdf9626bc03e24f779434178a73a0b4bad62ed
chartData.ts:65 fetching pool chart data 0 1619170975 0x4585fe77225b41b697c938b018e2ac67ac5a20c0
chartData.ts:65 fetching pool chart data 0 1619170975 0x4e68ccd3e89f51c3074ca5072bbac773960dfa36
chartData.ts:65 fetching pool chart data 0 1619170975 0x5777d92f208679db4b9778590fa3cab3ac9e2168
chartData.ts:65 fetching pool chart data 0 1619170975 0xc63b0708e2f7e69cb8a1df0e1389a98c35a76d52
chartData.ts:65 fetching pool chart data 0 1619170975 0x99ac8ca7087fa4a2a1fb6357269965a2014abc35
chartData.ts:65 fetching pool chart data 0 1619170975 0x7379e81228514a1d2a6cf7559203998e20598346
chartData.ts:65 fetching pool chart data 0 1619170975 0x6c6bc977e13df9b0de53b251522280bb72383700
chartData.ts:65 fetching pool chart data 0 1619170975 0x11b815efb8f581194ae79006d24e0d814b7697f6
chartData.ts:65 fetching pool chart data 0 1619170975 0x3416cf6c708da44db2624d63ea0aaef7113527c6
chartData.ts:65 fetching pool chart data 0 1619170975 0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8
chartData.ts:65 fetching pool chart data 0 1619170975 0x1d42064fc4beb5f8aaf85f4617ae8b3b5b8bd801
chartData.ts:65 fetching pool chart data 0 1619170975 0xa6cc3c2531fdaa6ae1a3ca84c2855806728693e8
chartData.ts:65 fetching pool chart data 0 1619170975 0x290a6a7460b308ee3f19023d2d00de604bcf5b42
chartData.ts:65 fetching pool chart data 0 1619170975 0x5c128d25a21f681e678cb050e551a895c9309945
chartData.ts:65 fetching pool chart data 0 1619170975 0x97e7d56a0408570ba1a7852de36350f7713906ec
chartData.ts:65 fetching pool chart data 0 1619170975 0xc5af84701f98fa483ece78af83f11b6c38aca71d
chartData.ts:65 fetching pool chart data 0 1619170975 0xa3f558aebaecaf0e11ca4b2199cc5ed341edfd74

and this with the graph node:
fetching pool chart data 0 1619170975 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
chartData.ts:66 fetching pool chart data 0 1619170975 0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8
chartData.ts:66 fetching pool chart data 0 1619170975 0xcbcdf9626bc03e24f779434178a73a0b4bad62ed
chartData.ts:66 fetching pool chart data 0 1619170975 0x4585fe77225b41b697c938b018e2ac67ac5a20c0
chartData.ts:66 fetching pool chart data 0 1619170975 0x4e68ccd3e89f51c3074ca5072bbac773960dfa36
chartData.ts:66 fetching pool chart data 0 1619170975 0x5777d92f208679db4b9778590fa3cab3ac9e2168
chartData.ts:66 fetching pool chart data 0 1619170975 0xc63b0708e2f7e69cb8a1df0e1389a98c35a76d52
chartData.ts:66 fetching pool chart data 0 1619170975 0x99ac8ca7087fa4a2a1fb6357269965a2014abc35
chartData.ts:66 fetching pool chart data 0 1619170975 0x7379e81228514a1d2a6cf7559203998e20598346
chartData.ts:66 fetching pool chart data 0 1619170975 0x6c6bc977e13df9b0de53b251522280bb72383700
chartData.ts:66 fetching pool chart data 0 1619170975 0x11b815efb8f581194ae79006d24e0d814b7697f6
chartData.ts:66 fetching pool chart data 0 1619170975 0x3416cf6c708da44db2624d63ea0aaef7113527c6
chartData.ts:66 fetching pool chart data 0 1619170975 0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8
chartData.ts:66 fetching pool chart data 0 1619170975 0x1d42064fc4beb5f8aaf85f4617ae8b3b5b8bd801
chartData.ts:66 fetching pool chart data 0 1619170975 0xa6cc3c2531fdaa6ae1a3ca84c2855806728693e8
chartData.ts:66 fetching pool chart data 0 1619170975 0x290a6a7460b308ee3f19023d2d00de604bcf5b42
chartData.ts:66 fetching pool chart data 0 1619170975 0x5c128d25a21f681e678cb050e551a895c9309945
chartData.ts:66 fetching pool chart data 0 1619170975 0x97e7d56a0408570ba1a7852de36350f7713906ec
chartData.ts:66 fetching pool chart data 0 1619170975 0xc5af84701f98fa483ece78af83f11b6c38aca71d
chartData.ts:66 fetching pool chart data 0 1619170975 0xa3f558aebaecaf0e11ca4b2199cc5ed341edfd74
      * */
      const { data: chartResData, error, loading } = await client.query<ChartResults>({
        query: POOL_CHART,
        variables: {
          address: address,
          startTime: startTimestamp,
          skip,
        },
        fetchPolicy: 'cache-first',
      })
      if (!loading) {
        skip += 1000
        if (chartResData.poolDayDatas.length < 1000 || error) {
          allFound = true
        }
        if (chartResData) {
          data = data.concat(chartResData.poolDayDatas)
        }
      }
    }
  } catch {
    error = true
  }

  if (data) {
    const formattedExisting = data.reduce((accum: { [date: number]: PoolChartEntry }, dayData) => {
      const roundedDate = parseInt((dayData.date / ONE_DAY_UNIX).toFixed(0))
      const feePercent = parseFloat(dayData.pool.feeTier) / 10000
      const tvlAdjust = dayData?.volumeUSD ? parseFloat(dayData.volumeUSD) * feePercent : 0

      accum[roundedDate] = {
        date: dayData.date,
        volumeUSD: parseFloat(dayData.volumeUSD),
        totalValueLockedUSD: parseFloat(dayData.tvlUSD) - tvlAdjust,
        feesUSD: parseFloat(dayData.feesUSD),
      }
      return accum
    }, {})

    const firstEntry = formattedExisting[parseInt(Object.keys(formattedExisting)[0])]

    // fill in empty days ( there will be no day datas if no trades made that day )
    let timestamp = firstEntry?.date ?? startTimestamp
    let latestTvl = firstEntry?.totalValueLockedUSD ?? 0
    while (timestamp < endTimestamp - ONE_DAY_UNIX) {
      const nextDay = timestamp + ONE_DAY_UNIX
      const currentDayIndex = parseInt((nextDay / ONE_DAY_UNIX).toFixed(0))
      if (!Object.keys(formattedExisting).includes(currentDayIndex.toString())) {
        formattedExisting[currentDayIndex] = {
          date: nextDay,
          volumeUSD: 0,
          totalValueLockedUSD: latestTvl,
          feesUSD: 0,
        }
      } else {
        latestTvl = formattedExisting[currentDayIndex].totalValueLockedUSD
      }
      timestamp = nextDay
    }

    const dateMap = Object.keys(formattedExisting).map((key) => {
      return formattedExisting[parseInt(key)]
    })

    return {
      data: dateMap,
      error: false,
    }
  } else {
    return {
      data: undefined,
      error,
    }
  }
}
