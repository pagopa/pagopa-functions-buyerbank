import {
  ErrorResponses,
  ResponseErrorUnauthorized,
  toErrorServerResponse
} from "../responses";

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

describe("response", () => {
  it("should return IResponseErrorInternal with 500 status code", () => {
    const error: ErrorResponses = toErrorServerResponse({
      headers: {},
      status: 500,
      value: {}
    });

    expect(error.kind).toBe("IResponseErrorInternal");
  });

  it("should return IResponseErrorUnauthorized if response status is 401 ", () => {
    const error401: ErrorResponses = toErrorServerResponse({
      headers: {},
      status: 401,
      value: {}
    });

    expect(error401.kind).toBe("IResponseErrorUnauthorized");
  });

  it("should return IResponseErrorUnauthorized if response status is 403", () => {
    const error403: ErrorResponses = toErrorServerResponse({
      headers: {},
      status: 403,
      value: {}
    });

    expect(error403.kind).toBe("IResponseErrorForbiddenNotAuthorized");
  });

  it("should return ResponseErrorNotFound if response status is 404", () => {
    const error404: ErrorResponses = toErrorServerResponse({
      headers: {},
      status: 404,
      value: {}
    });

    expect(error404.kind).toBe("IResponseErrorNotFound");
  });

  it("should return ResponseErrorNotFound if response status is 429", () => {
    const error429: ErrorResponses = toErrorServerResponse({
      headers: {},
      status: 429,
      value: {}
    });

    expect(error429.kind).toBe("IResponseErrorTooManyRequests");
  });

  it("should return IResponseErrorInternal with 502 status code", () => {
    const error502: ErrorResponses = toErrorServerResponse({
      headers: {},
      status: 502,
      value: {}
    });

    expect(error502.kind).toBe("IResponseErrorInternal");
  });

  it("should return IResponseErrorUnauthorized if response status is 401 ", () => {
    const errorUnauthorized = ResponseErrorUnauthorized("title", "detail");

    expect(errorUnauthorized.kind).toBe("IResponseErrorUnauthorized");
  });
});
