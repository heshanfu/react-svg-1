import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'
import ReactSVG from '../src'
import { source, rendered, updated } from './fixtures'

// Notes:
//
// - SVGInjector uses setTimeout to process it's XHR queue, so we control
//   request processing manually via Jest and Sinon.
// - Even though we're always responding with `sourceSVG`, we use different
//   `path` values when mounting within each test so that SVGInjector doesn't
//   use it's internal cache. This keeps the tests isolated from one another.

jest.useFakeTimers()

describe('ReactSVG', () => {
  let container
  let xhr
  let requests
  let wrapper

  beforeEach(() => {
    container = document.body.appendChild(document.createElement('div'))
    xhr = sinon.useFakeXMLHttpRequest()
    requests = []
    xhr.onCreate = xhr => {
      requests.push(xhr)
    }
  })

  afterEach(() => {
    xhr.restore()
    document.body.removeChild(container)
  })

  it('should render correctly', () => {
    wrapper = mount(
      <ReactSVG
        className="wrapper-class-name"
        path="http://localhost/render-source.svg"
        svgClassName="svg-class-name"
        svgStyle={{ height: 200 }}
      />,
      { attachTo: container }
    )

    requests[0].respond(200, {}, source)
    jest.runAllTimers()

    expect(wrapper.html()).toBe(rendered)
  })

  it('should update correctly', () => {
    wrapper = mount(
      <ReactSVG
        className="wrapper-class-name"
        path="http://localhost/update-source.svg"
        svgClassName="svg-class-name"
        svgStyle={{ height: 200 }}
      />,
      { attachTo: container }
    )

    requests[0].respond(200, {}, source)
    jest.runAllTimers()

    wrapper.setProps({
      svgClassName: 'updated-svg-class-name',
      svgStyle: { height: 100 }
    })

    expect(wrapper.html()).toBe(updated)
  })

  it('should unmount correctly', () => {
    wrapper = mount(
      <ReactSVG
        svgClassName="svg-class-name"
        path="http://localhost/unmount-source.svg"
        svgStyle={{ height: 200 }}
      />,
      { attachTo: container }
    )

    requests[0].respond(200, {}, source)
    jest.runAllTimers()

    wrapper.detach()

    expect(container.innerHTML).toBe('')
  })

  it('should ensure a parent node is always available when SVGInjector tries to access the DOM', () => {
    // One way to test this scenario is to unmount the component, which removes
    // the wrapper node, then let SVGInjector do it's usual DOM manipulation by
    // running the timers.
    expect(() => {
      wrapper = mount(
        <ReactSVG
          svgClassName="svg-class-name"
          path="http://localhost/parent-node-source.svg"
          svgStyle={{ height: 200 }}
        />,
        { attachTo: container }
      )

      wrapper.detach()

      requests[0].respond(200, {}, source)
      jest.runAllTimers()
    }).not.toThrow()
  })
})
