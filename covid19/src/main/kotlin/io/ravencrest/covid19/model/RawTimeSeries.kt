package io.ravencrest.covid19.model

import java.time.LocalDate

data class RawTimeSeries(val region: String, val points: List<Long?>) {
  fun toTimeSeries(headers: List<LocalDate>): TimeSeries {
    val points = points.mapIndexed { index, item ->
      if (item != null) {
        Point(
          date = headers[index],
          value = item
        )
      } else {
        null
      }
    }.filterNotNull()
    return TimeSeries(
      region = this.region,
      points = points.sortedBy { it.date }
    )
  }
}