import INJECTED_DARK_ICON from 'assets/svg/browser-wallet-dark.svg'
import INJECTED_LIGHT_ICON from 'assets/svg/browser-wallet-light.svg'
import { getConnections, useGetConnection } from 'connection'
import { renderHook } from 'test-utils/render'

import { ConnectionType } from './types'

const UserAgentMock = jest.requireMock('utils/userAgent')
jest.mock('utils/userAgent', () => ({
  isMobile: false,
}))

describe('connection utility/metadata tests', () => {
  const createWalletEnvironment = (ethereum: Window['window']['ethereum'], isMobile = false) => {
    UserAgentMock.isMobile = isMobile
    global.window.ethereum = ethereum

    const displayed = getConnections().filter((c) => c.shouldDisplay())
    const getConnection = renderHook(() => useGetConnection()).result.current
    const injected = getConnection(ConnectionType.INJECTED)
    const walletconnect = getConnection(ConnectionType.WALLET_CONNECT)

    return { displayed, injected, walletconnect }
  }

  it('Non-injected Desktop', async () => {
    const { displayed, injected } = createWalletEnvironment(undefined)

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getName()).toBe('MetaMask')
    expect(injected.overrideActivate?.()).toBeTruthy()

    expect(displayed.length).toEqual(4)
  })

  it('MetaMask-Injected Desktop', async () => {
    const { displayed, injected } = createWalletEnvironment({ isMetaMask: true })

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getName()).toBe('MetaMask')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(displayed.length).toEqual(4)
  })

  it('Generic Injected Desktop', async () => {
    const { displayed, injected } = createWalletEnvironment({ isTrustWallet: true })

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getName()).toBe('Browser Wallet')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(displayed.length).toEqual(4)
  })

  it('Generic Browser Wallet that injects as MetaMask', async () => {
    const { displayed, injected } = createWalletEnvironment({ isRabby: true, isMetaMask: true })

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getName()).toBe('Browser Wallet')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(displayed.length).toEqual(4)
  })

  it('Generic Wallet Browser with delayed injection', async () => {
    const { injected } = createWalletEnvironment(undefined)

    expect(injected.getName()).toBe('MetaMask')
    expect(injected.overrideActivate?.()).toBeTruthy()

    createWalletEnvironment({ isTrustWallet: true })

    expect(injected.getName()).toBe('Browser Wallet')
    expect(injected.overrideActivate?.()).toBeFalsy()
  })

  const UNKNOWN_INJECTOR = { isRandomWallet: true } as Window['window']['ethereum']
  it('Generic Unknown Injected Wallet Browser', async () => {
    const { displayed, injected } = createWalletEnvironment(UNKNOWN_INJECTOR, true)

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getName()).toBe('Browser Wallet')
    expect(injected.overrideActivate?.()).toBeFalsy()

    expect(injected.getIcon?.(/* isDarkMode */ false)).toBe(INJECTED_LIGHT_ICON)
    expect(injected.getIcon?.(/* isDarkMode */ true)).toBe(INJECTED_DARK_ICON)

    // Ensures we provide multiple connection options if in an unknown injected browser
    expect(displayed.length).toEqual(4)
  })

  it('MetaMask Mobile Browser', async () => {
    const { displayed, injected } = createWalletEnvironment({ isMetaMask: true }, true)

    expect(displayed.includes(injected)).toBe(true)
    expect(injected.getName()).toBe('MetaMask')
    expect(injected.overrideActivate?.()).toBeFalsy()
    expect(displayed.length).toEqual(1)
  })
})
