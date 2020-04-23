package io.ravencrest.covid19.model

import java.time.LocalDate

data class RawTimeSeries(val country: String, val points: List<Long?>) {
  fun toTimeSeries(headers: List<LocalDate>): TimeSeries {
    val points = points.mapIndexed { index, item ->
      if (item != null) {
        Point(
          country = this.country,
          date = headers[index],
          value = item
        )
      } else {
        null
      }
    }.filterNotNull().toSet()
    return TimeSeries(
      country = this.country,
      points = points
    )
  }
}