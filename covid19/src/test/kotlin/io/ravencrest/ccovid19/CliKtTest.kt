package io.ravencrest.ccovid19

import io.ravencrest.covid19.getChangePercent
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

internal class CliKtTest {

  @Test
  fun testGetChangePercentLong() {
    assertEquals(10.0, getChangePercent(11, 10))
    assertEquals(0.0, getChangePercent(10, 0))
  }

  @Test
  fun testGetChangePercentDouble() {
    assertEquals(10, getChangePercent(11.0, 10.0))
    assertEquals(0, getChangePercent(10.0, 0.0))
  }
}